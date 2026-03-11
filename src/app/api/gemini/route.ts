import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF FIX: Inline Prisma initialization
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

    // Fetch the Live API Key from your SaaS Settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "System Error: Gemini API Key is missing. Please configure it in the Command Center." });
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. FETCH LIVE INVENTORY (THE RAG MAGIC)
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

    // 🚀 CRITICAL FIX: EXPLICITLY build the object to guarantee massive Base64 imageUrls are stripped!
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

    // 🚀 EXPLICITLY build safe page context
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

    // Deep Page Context Injection
    const pageContext = safePageContext
      ? `\nCRITICAL PAGE CONTEXT: The user is currently viewing a specific property page: ${JSON.stringify(safePageContext)}.
      If the user says "this property", "tell me more", or asks specific questions, assume they are talking about THIS property.`
      : "";

    const financialContextString = financialContext 
      ? `\nFINANCIAL & PREDICTIVE CONTEXT (READ THIS IF ASKED ABOUT VALUATION OR INVESTMENT):
      ${JSON.stringify(financialContext)}
      If the user asks about 'AI Predictive Valuation', 'Investment Thesis', or 'Rent vs Buy', use this precise data to explain the future value and costs mathematically.`
      : "";

    // 🚀 DYNAMIC IDENTITY PROMPT
    let identityPrompt = `
CRITICAL RULE 2: THE 3 PROTOCOLS (BUY, RENT, SELL)
1. BUYING/RENTING: Ask for preferred location, budget, and size. Offer matching properties from the Live Inventory.
2. SELLING: If a user wants to SELL a property, ENTHUSIASTICALLY accept! Ask for the location, size, and asking price.
3. LEAD CAPTURE: Always ask for the user's NAME so you can personalize the conversation, and their WHATSAPP number so an agent can contact them.
`;

    if (userContext?.isLoggedIn) {
      identityPrompt = `
CRITICAL RULE 2: VIP LOGGED-IN INVESTOR PROTOCOL
1. BUYING/RENTING: Ask for preferred location, budget, and size. Offer matching properties from the Live Inventory.
2. SELLING: If a user wants to SELL a property, ENTHUSIASTICALLY accept! Ask for the location, size, and asking price.
3. IDENTITY AWARENESS (STRICT): You are talking to a registered, logged-in VIP Investor named ${userContext.userName}.
   - DO NOT ask for their name.
   - DO NOT ask for their phone number or WhatsApp (we already have it securely on file).
   - ${userContext.hasSavedThisProperty ? `Acknowledge that they have already saved/favorited this specific property.
     Ask if they are ready to schedule a site visit.` : `Help them evaluate this property.`}
`;
    }

    // 2. THE ULTIMATE SALES & RAG PROMPT
    const systemInstruction = `
You are the exclusive AI Sales Assistant for LahorePropertyGuide.com. The current year is 2026.
${pageContext}
${financialContextString}

CRITICAL RULE 1: INSTANT LANGUAGE OVERRIDE (STRICT)
You MUST instantly adapt to the language of the user's MOST RECENT message.
If the chat history was in Roman Urdu, but the user just asked "tell me about this property" in English, your reply MUST be in professional English.
NEVER reply in Roman Urdu to an English prompt.

${identityPrompt}

CRITICAL RULE 3: LEAD SCORING
Secretly score the user (Max 100): Base(10) + Name(10) + Overseas(30) + Valid Number(20).
If their purpose is "sell", add an automatic +30 points because sellers are high value!

CRITICAL RULE 4: LIVE INVENTORY & PROACTIVE DISCOVERY (NO HALLUCINATIONS)
- For specific buyer/renter queries, you must ONLY recommend matching properties from the "Live Inventory" below. NEVER invent properties.
- PROACTIVE GREETING FIX: If the user just says "Hello", "Hi", "Aoa", or provides no specific requirements, DO NOT return an empty properties list.
  Instead, proactively select 3-5 properties from the Live Inventory where "isFeatured" is true to show them as top picks.
- NOTE: Pay special attention to "paymentMode" (Cash vs Installment) and "criticalNotes" to answer specific buyer questions.

LIVE INVENTORY DATA:
${JSON.stringify(safePropertiesForPrompt)}

CRITICAL RULE 5: CHAT SUMMARY & SMART LINKS
When writing the "chatSummary", if the user is asking about a specific property from the context or recommendations, you MUST include its clickable link so our human agents know exactly what they viewed.
Format it like this: "User is interested in this property: https://lahorepropertyguide.com/properties/[property-id]"

CRITICAL RULE 6: STRICT JSON OUTPUT
Always return your response in this exact JSON format:
{
  "reply": "Your persuasive, conversational reply following Rules 1 and 2.",
  "leadData": {
    "score": 90,
    "extractedName": "Name if provided, else null",
    "extractedPhone": "Phone if provided, else null",
    "extractedLocation": "Location if provided, else null",
    "extractedBudget": "Budget if provided, else null",
    "intent": "A 1-sentence summary of their goal",
    "chatSummary": "A brief summary of the conversation. MUST INCLUDE PROPERTY LINK if discussing a specific listing.",
    "purpose": "buy, rent, or sell",
    "category": "Home, Plot, Commercial, or Flats",
    "subCategory": "House, Plot File, Shop, etc.",
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

    // 3. CONFIGURE GEMINI MODEL
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    // 4. FORMAT HISTORY & SEND (SAFEGUARD AGAINST MASSIVE PAYLOADS)
    const formattedHistory = history.map((msg: any) => {
      // Emergency safeguard: truncate any abnormally large chat messages
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

    // 🚀 POST-PROCESS: Stitch the massive Base64 Image URLs back onto the response so the frontend renders them correctly!
    if (data.properties && Array.isArray(data.properties)) {
      data.properties = data.properties.map((recProp: any) => {
        const original = liveProperties.find(p => p.id === recProp.id);
        const img = original?.imageUrl || (currentPropertyContext?.id === recProp.id ? currentPropertyContext.imageUrl : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800");
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

    // 5. SMART DATABASE INJECTION (FIXED DEDUPLICATION)
    if (data.leadData && (data.leadData.score >= 20 || data.leadData.purpose === 'sell' || userContext?.isLoggedIn)) {
      const leadName = userContext?.isLoggedIn ? userContext.userName : (data.leadData.extractedName || "Anonymous Guest");
      const mappedUserId = userContext?.isLoggedIn ? userContext.userId : null;

      // Only match if leadName is not Anonymous OR mappedUserId exists.
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