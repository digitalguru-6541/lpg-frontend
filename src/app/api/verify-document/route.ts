import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF FIX: Inline Prisma initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No document provided" }, { status: 400 });
    }

    // 1. Fetch your existing Gemini Key
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key missing. Please check your .env or Command Center settings." }, { status: 500 });
    }

    // 2. Format the Base64 image securely
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // 3. 🚀 STRICT AUDITOR PROMPT (Forces JSON Output)
    const engineeredPrompt = `
      You are an expert Real Estate Legal Auditor specializing in property documents.
      Analyze this uploaded document and extract the key information.
      Look for signs of tampering, missing signatures, or blurry text that might indicate a fake document.
      
      You MUST return your response strictly as a raw JSON object. Do not include markdown blockquotes or the word "json".
      Use this exact JSON structure:
      {
        "documentType": "String (e.g., DHA Allotment Letter, Token Receipt, Unknown)",
        "ownerName": "String or null if not found",
        "referenceNumber": "String or null if not found",
        "plotDetails": "String (e.g., 10 Marla, Phase 6) or null",
        "anomaliesFound": ["Array of strings describing suspicious elements, or empty array"],
        "confidenceScore": Number (0 to 100),
        "isVerified": Boolean (true if confidence is > 80 and no major anomalies)
      }
    `;

    // 4. Call the upgraded Gemini 2.5 Flash Model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: engineeredPrompt },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json" // Force JSON validation
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to analyze document via Gemini");
    }

    // 5. Safely Parse the Gemini Output
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No text returned from AI Engine.");

    // 🚀 CRITICAL FIX: Strip any accidental markdown formatting
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    const auditReport = JSON.parse(rawText);

    return NextResponse.json({ 
      success: true, 
      auditReport 
    });

  } catch (error: any) {
    console.error("Document Verification Error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify document" }, { status: 500 });
  }
}