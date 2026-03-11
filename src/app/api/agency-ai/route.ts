import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const { history, dashboardData } = await req.json();

    if (!history || !Array.isArray(history)) {
      return NextResponse.json({ error: "Invalid history format" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ reply: "System Error: Gemini API Key is missing." });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);

    const systemInstruction = `
    You are an elite, high-performing Real Estate Sales Director AI built specifically to help agents at "CDB Properties" close deals.
    You are interacting directly with the real estate agent (NOT the buyer/seller).

    CRITICAL INSTRUCTIONS:
    1. CONTEXT & ID AWARENESS: You have live CRM data below. Every lead has a 'shortId' (e.g., "D8B27"). You MUST use this ID to uniquely identify leads. If an agent mentions a name without an ID, politely ask them to confirm the 5-character ID from their dashboard to ensure accuracy.
    2. STEP-BY-STEP COACHING (CRITICAL): DO NOT overwhelm the agent with massive walls of text. Be conversational. Give ONE piece of advice or ONE step at a time. 
    3. INTERACTIVE SCRIPTS: If an agent needs to reach out (e.g., "Client isn't answering"), do NOT immediately dump both a call script and a WhatsApp script. Instead, analyze the lead's summary, offer a 1-sentence strategy, and ASK the agent: "Would you like me to draft a high-converting WhatsApp message for this, or give you an angle for your next phone call?"
    4. SYSTEM CONFINES: Only answer questions related to real estate sales, closing deals, and managing the provided CRM pipeline.

    LIVE CRM DASHBOARD DATA:
    ${JSON.stringify(dashboardData)}

    Tone: Professional, motivational, razor-sharp, highly strategic, and conversational.
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: formattedHistory.slice(0, -1) });
    const latestMessage = history[history.length - 1].content;
    const result = await chat.sendMessage(latestMessage);
    
    return NextResponse.json({ reply: result.response.text() });

  } catch (error) {
    console.error("Agency AI Error:", error);
    return NextResponse.json({ reply: "I'm experiencing a temporary network delay. Please try asking your question again." });
  }
}