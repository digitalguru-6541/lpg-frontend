import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 NUMBER FORMATTER FOR AI READABILITY
const formatFullPKR = (value: any) => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return "Contact for Price";
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    const lakhs = Math.floor((num % 10000000) / 100000);
    return lakhs > 0 ? `${crores} Crore ${lakhs} Lakhs` : `${crores} Crore`;
  }
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    const thousands = Math.floor((num % 100000) / 1000);
    return thousands > 0 ? `${lakhs} Lakhs ${thousands} Thousand` : `${lakhs} Lakhs`;
  }
  return num.toLocaleString();
};

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 🧠 FETCH CHAT MEMORY FROM DATABASE
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ messages: [] });
    }

    const chatHistory = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true }
    });

    return NextResponse.json({ messages: chatHistory });
  } catch (error) {
    console.error("Database Memory Error:", error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const history = body.history;
    const currentPropertyContext = body.currentProperty;
    const financialContext = body.financialContext;
    const userContext = body.userContext;
    const sessionId = body.sessionId;

    if (!history || !Array.isArray(history)) {
      return NextResponse.json({ error: "Invalid history format" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "System Error: Gemini API Key is missing. Please configure it in the Command Center." });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. FETCH LIVE STANDARD INVENTORY
    const liveProperties = await prisma.property.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, purpose: true, category: true, subCategory: true,
        priceFormatted: true, size: true, bedrooms: true, bathrooms: true,
        isFurnished: true, location: true, city: true, imageUrl: true, isFeatured: true,
        paymentMode: true, installmentPlan: true, criticalNotes: true
      }
    });

    // 🚀 NEW: FETCH PREMIUM MEGA PROJECTS
    const liveMegaProjects = await prisma.megaProject.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, location: true, 
        startingPrice: true, estRoi: true, projectType: true, agencyName: true, coverImage: true
      }
    });

    const safePropertiesForPrompt = liveProperties.map(p => ({
      id: p.id,
      title: p.title,
      purpose: p.purpose,
      category: p.category,
      subCategory: p.subCategory,
      priceFormatted: p.priceFormatted,
      size: p.size,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      isFurnished: p.isFurnished,
      location: p.location,
      city: p.city,
      paymentMode: p.paymentMode,
      installmentPlan: p.installmentPlan,
      criticalNotes: p.criticalNotes,
      isFeatured: p.isFeatured
    }));

    const safeMegaProjectsForPrompt = liveMegaProjects.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      location: p.location,
      priceFormatted: formatFullPKR(p.startingPrice),
      estRoi: p.estRoi,
      projectType: p.projectType,
      agencyName: p.agencyName,
      isMegaProject: true
    }));

    let safePageContext = null;
    if (currentPropertyContext && currentPropertyContext.id) {
      safePageContext = {
        id: currentPropertyContext.id,
        title: currentPropertyContext.title,
        priceFormatted: currentPropertyContext.priceFormatted,
        location: currentPropertyContext.location,
        purpose: currentPropertyContext.purpose,
        category: currentPropertyContext.category,
        paymentMode: currentPropertyContext.paymentMode,
        installmentPlan: currentPropertyContext.installmentPlan,
        criticalNotes: currentPropertyContext.criticalNotes
      };
    }

    const pageContext = safePageContext
      ? `\nCRITICAL PAGE CONTEXT: The user is currently viewing a specific property page: ${JSON.stringify(safePageContext)}.
         If the user says "this property", "tell me more", or asks specific questions, assume they are talking about THIS property.`
      : "";

    const financialContextString = financialContext
      ? `\nFINANCIAL & PREDICTIVE CONTEXT (READ THIS IF ASKED ABOUT VALUATION OR INVESTMENT):
         ${JSON.stringify(financialContext)}
         If the user asks about 'AI Predictive Valuation', 'Investment Thesis', or 'Rent vs Buy', use this precise data to explain the future value and costs mathematically.`
      : "";

    let identityPrompt = `
      CRITICAL RULE 3: THE 3 PROTOCOLS (BUY, RENT, SELL)
      1. BUYING/RENTING: Ask for preferred location, budget, and size. Offer matching properties from the Live Standard Inventory.
      2. SELLING: If a user wants to SELL a property, ENTHUSIASTICALLY accept! Ask for the location, size, and asking price.
      3. LEAD CAPTURE: Always ask for the user's NAME so you can personalize the conversation, and their WHATSAPP number so an agent can contact them.
    `;

    if (userContext?.isLoggedIn) {
      identityPrompt = `
        CRITICAL RULE 3: VIP LOGGED-IN INVESTOR PROTOCOL
        1. BUYING/RENTING: Ask for preferred location, budget, and size. Offer matching properties from the Live Standard Inventory.
        2. SELLING: If a user wants to SELL a property, ENTHUSIASTICALLY accept! Ask for the location, size, and asking price.
        3. IDENTITY AWARENESS (STRICT): You are talking to a registered, logged-in VIP Investor named ${userContext.userName}.
        - DO NOT ask for their name or phone number.
        - ${userContext.hasSavedThisProperty ? `Acknowledge that they have already saved/favorited this specific property.
        Ask if they are ready to schedule a site visit.` : `Help them evaluate this property.`}
      `;
    }

    const systemInstruction = `
      You are an elite, highly persuasive, and genuinely friendly Real Estate Advisor for LahorePropertyGuide.com. The current year is 2026.
      Your tone blends high-end consultative wealth-management expertise with a warm, engaging, and approachable AI persona.
      You NEVER explicitly call yourself a "sales executive" and you NEVER mention our partner agencies or developers by name.

      ${pageContext}
      ${financialContextString}

      CRITICAL RULE 1: VISUAL FORMATTING, EMOJIS & PACING
      - You MUST use short, punchy paragraphs.
      - You MUST use Markdown bullet points to break down complex information.
      - You MUST sprinkle relevant emojis naturally throughout your response.
      - NEVER output a giant, dense block of text.
      - CONVERSATIONAL ENGAGEMENT: Talk *with* the user, not *at* them. Always end your response with a friendly, low-friction question.

      CRITICAL RULE 2: STRICT SCRIPT & LANGUAGE MIRRORING (CRITICAL)
      You MUST instantly adapt to the exact language AND the exact ALPHABET of the user's message.
      - ROMAN URDU LOCK: If the user types Urdu using English letters (Roman Urdu), YOU MUST REPLY ENTIRELY IN ROMAN URDU. 
      - NEVER use the native Urdu/Arabic script (e.g., السلام علیکم) unless the user explicitly types their message in that exact script first.
      - Match their exact conversational tone, whether it is highly professional English or casual Roman Urdu.

      ${identityPrompt}

      CRITICAL RULE 4: THE SMART CONSULTATIVE APPROACH (NO PUSHING)
      Your goal is to guide the user naturally based on their explicit needs.
      - SPECIFIC QUERIES: If they ask for a specific house, plot, rental, or to sell, give them EXACTLY what they asked for from the Live Standard Inventory. Do not push Mega Projects if they just want to rent a flat.
      - GENERIC QUERIES (Investment, ROI, "Best Options"): If their query is generic or investment-focused (e.g., "I have 5 crores", "Best options in Lahore?"), offer a smart mix.
      - STRATEGY: Introduce ONE "Premium Mega Project" (for high ROI/off-plan) and ONE "Featured Property" (for ready assets).
      - CONSENT PROTOCOL: NEVER info-dump. Give a 1-sentence teaser about a project and ASK for consent. Example: "We just launched an exclusive Master Development offering 24% ROI. Would you like me to share the details?"

      CRITICAL RULE 5: MEGA PROJECTS ROUTING
      - You have access to exclusive "Premium Mega Projects" in your data below.
      - If a user agrees to hear about a Mega Project, or asks about one specifically, give them the highlights (Starting Price, ROI, Location).
      - You MUST tell them to click the link to view the full brochure. Use this exact Markdown format: [View Full Project Details Here](https://lahorepropertyguide.com/projects/THE-PROJECT-SLUG)

      CRITICAL RULE 6: LEAD SCORING
      Secretly score the user (Max 100): Base(10) + Name(10) + Overseas(30) + Valid Number(20). If their purpose is "sell", add an automatic +30 points.

      CRITICAL RULE 7: PROACTIVE DISCOVERY
      - For specific buyer/renter queries, ONLY recommend matching properties. NEVER invent properties.
      - PROACTIVE GREETING: If the user just says "Hello", DO NOT return an empty list. Proactively select 2 Featured standard properties and 1 Premium Mega Project to tease.

      LIVE INVENTORY DATA:
      --- Standard Properties ---
      ${JSON.stringify(safePropertiesForPrompt)}

      --- Premium Mega Projects ---
      ${JSON.stringify(safeMegaProjectsForPrompt)}

      CRITICAL RULE 8: CHAT SUMMARY & SMART LINKS
      When writing the "chatSummary", if the user is asking about a specific property, you MUST include its clickable link.

      CRITICAL RULE 9: STRICT JSON OUTPUT
      Always return your response in this exact JSON format:
      {
        "reply": "Your beautifully formatted, conversational reply.",
        "leadData": {
          "score": 90,
          "extractedName": "Name if provided, else null",
          "extractedPhone": "Phone if provided, else null",
          "extractedLocation": "Location if provided, else null",
          "extractedBudget": "Budget if provided, else null",
          "intent": "A 1-sentence summary of their goal",
          "chatSummary": "A brief summary. MUST INCLUDE PROPERTY LINK if discussing a specific listing.",
          "purpose": "buy, rent, or sell",
          "category": "Home, Plot, Commercial, or Flats",
          "subCategory": "House, Plot File, Shop, Penthouse, etc.",
          "isFurnished": true or false
        },
        "properties": [
          {
            "id": "exact-id-from-inventory",
            "title": "Exact Title",
            "price": "Exact priceFormatted",
            "matchScore": "98%",
            "roiBadge": "Premium Yield",
            "isFeatured": true
          }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const formattedHistory = history.map((msg: any) => {
      let safeText = msg.content;
      if (typeof safeText === 'string' && safeText.length > 5000) {
        safeText = safeText.substring(0, 5000) + "... [System: Text Truncated due to size]";
      }
      return {
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: safeText }],
      };
    });

    const chat = model.startChat({ history: formattedHistory.slice(0, -1) });
    const latestMessage = formattedHistory[formattedHistory.length - 1].parts[0].text;

    const result = await chat.sendMessage(latestMessage);
    const responseText = result.response.text();
    const data = JSON.parse(responseText);

    // 🚀 POST-PROCESS: Stitch the massive Base64 Image URLs back onto the response (Checks both standard & mega projects)
    if (data.properties && Array.isArray(data.properties)) {
      data.properties = data.properties.map((recProp: any) => {
        const originalProp = liveProperties.find(p => p.id === recProp.id);
        const originalMega = liveMegaProjects.find(p => p.id === recProp.id);

        let img = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800";
        if (originalProp?.imageUrl) {
          img = originalProp.imageUrl;
        } else if (originalMega?.coverImage) {
          img = originalMega.coverImage;
        } else if (currentPropertyContext?.id === recProp.id) {
          img = currentPropertyContext.imageUrl;
        }

        return {
          ...recProp,
          imageUrl: img
        };
      });
    }

    // 🧠 SAVE CHAT MEMORY TO DATABASE
    if (sessionId) {
      await prisma.chatMessage.create({
        data: { sessionId, role: "user", content: latestMessage }
      });
      await prisma.chatMessage.create({
        data: { sessionId, role: "ai", content: data.reply }
      });
    }

    // 5. SMART DATABASE INJECTION
    if (data.leadData && (data.leadData.score >= 20 || data.leadData.purpose === 'sell' || userContext?.isLoggedIn)) {
      const leadName = userContext?.isLoggedIn ? userContext.userName : (data.leadData.extractedName || "Anonymous Guest");
      const mappedUserId = userContext?.isLoggedIn ? userContext.userId : null;

      const searchConditions = [];
      if (leadName !== "Anonymous Guest") searchConditions.push({ name: leadName });
      if (mappedUserId) searchConditions.push({ userId: mappedUserId });

      let existingLead = null;
      if (searchConditions.length > 0) {
        existingLead = await prisma.lead.findFirst({
          where: { OR: searchConditions },
          orderBy: { updatedAt: 'desc' }
        });
      }

      if (existingLead) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            userId: mappedUserId || existingLead.userId,
            score: data.leadData.score,
            phone: data.leadData.extractedPhone || existingLead.phone,
            location: data.leadData.extractedLocation || existingLead.location,
            budget: data.leadData.extractedBudget || existingLead.budget,
            intent: data.leadData.intent || existingLead.intent,
            chatSummary: data.leadData.chatSummary || existingLead.chatSummary,
            purpose: data.leadData.purpose || existingLead.purpose,
            category: data.leadData.category || existingLead.category,
            subCategory: data.leadData.subCategory || existingLead.subCategory,
            isFurnished: data.leadData.isFurnished || existingLead.isFurnished,
            status: "engaged"
          }
        });
      } else {
        await prisma.lead.create({
          data: {
            userId: mappedUserId,
            name: leadName,
            phone: data.leadData.extractedPhone || null,
            location: data.leadData.extractedLocation || null,
            budget: data.leadData.extractedBudget || null,
            intent: data.leadData.intent || "Browsing",
            chatSummary: data.leadData.chatSummary || "User initiated conversation.",
            score: data.leadData.score || 10,
            purpose: data.leadData.purpose || "buy",
            category: data.leadData.category || "Home",
            subCategory: data.leadData.subCategory || "House",
            isFurnished: data.leadData.isFurnished || false,
            status: "new"
          }
        });
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to communicate with the AI engine." }, { status: 500 });
  }
}