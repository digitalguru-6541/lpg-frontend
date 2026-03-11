import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF FIX: Inline Prisma initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, prompt, style, isModification } = body;

    if (!image) {
      return NextResponse.json({ error: "No plot image provided" }, { status: 400 });
    }

    // 1. Fetch your existing Gemini Key directly from your database settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    const apiKey = settings?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key missing. Please add it in the Command Center Settings tab." }, { status: 500 });
    }

    // 2. Format the Base64 image
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // 3. 🚀 DYNAMIC PROMPT LOGIC
    let engineeredPrompt = "";
    if (isModification) {
      // Logic for editing an existing design
      engineeredPrompt = `Modify the architectural rendering in this image. Keep the building structure, environment, and style exactly the same, but apply this specific change: ${prompt}. Do not change the overall house design unless requested. Return a single photorealistic image.`;
    } else {
      // Logic for building on an empty plot
      engineeredPrompt = `Transform this empty plot of land into a photorealistic architectural rendering of a ${prompt}. Architecture Style: ${style}. 8k resolution, professional real estate photography, beautiful lighting, highly detailed.`;
    }

    // 4. Call Google's Unified Gemini Image Model via the standard endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: engineeredPrompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data.error?.message || "Failed to generate image from Gemini");
    }

    // 5. Gemini returns the newly generated image inside the 'inlineData' part
    const candidate = data.candidates?.[0];
    const generatedPart = candidate?.content?.parts?.find((p: any) => p.inlineData);

    if (!generatedPart || !generatedPart.inlineData) {
      console.error("Unexpected Gemini response:", data);
      throw new Error("Gemini API did not return an image.");
    }

    // 6. Reformat the Base64 back into a readable Image URL for the frontend
    const generatedBase64 = generatedPart.inlineData.data;
    const generatedMimeType = generatedPart.inlineData.mimeType || "image/jpeg";
    const generatedImageUrl = `data:${generatedMimeType};base64,${generatedBase64}`;

    return NextResponse.json({ 
      success: true, 
      generatedImage: generatedImageUrl,
      appliedStyle: style
    });

  } catch (error: any) {
    console.error("Gemini Image Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate architecture" }, { status: 500 });
  }
}