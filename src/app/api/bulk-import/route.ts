import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../../../lib/prisma";

// 🚀 INITIALIZE GOOGLE CLOUD STORAGE
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});
const bucketName = process.env.GCS_BUCKET_NAME;

// 🚀 INITIALIZE GEMINI AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    if (!bucketName) throw new Error("GCS_BUCKET_NAME is missing.");
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");

    const formData = await req.formData();
    const blockCount = parseInt(formData.get("blockCount") as string || "0");

    if (blockCount === 0) {
      return NextResponse.json({ error: "No properties submitted." }, { status: 400 });
    }

    const bucket = storage.bucket(bucketName);
    const successfullyProcessed = [];

    // PARALLEL PROCESSING LOOP
    for (let i = 0; i < blockCount; i++) {
      const rawInput = formData.get(`text_${i}`) as string;
      const files = formData.getAll(`file_${i}`) as File[];

      if (!rawInput || files.length === 0) continue;

      console.log(`⏳ Processing Property ${i + 1} of ${blockCount}...`);

      // ==========================================
      // PIPELINE URL SCRAPER
      // ==========================================
      let textToAnalyze = rawInput;
      
      if (rawInput.trim().startsWith("http")) {
        try {
          console.log(`🔗 URL detected. Scraping Zameen data: ${rawInput}`);
          const response = await fetch(rawInput.trim(), {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml",
              "Accept-Language": "en-US,en;q=0.9",
            }
          });

          if (!response.ok) throw new Error(`Scrape failed with status: ${response.status}`);
          
          const html = await response.text();
          const cleanText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ");
            
          textToAnalyze = cleanText;
          console.log(`✅ Successfully scraped website.`);
        } catch (scrapeError: any) {
          console.error(`🚨 Scraping Failed: ${scrapeError.message}`);
          throw new Error(`Could not scrape the Zameen URL for Block ${i + 1}. Please paste the raw text instead.`);
        }
      }

      // ==========================================
      // PIPELINE A: STRICT JSON DATA EXTRACTION & WHITE-LABELING
      // ==========================================
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      // 🚀 NEW: Added strict White-Labeling instructions and source fields
      const prompt = `
        You are a highly accurate data extraction API and a white-label real estate copywriter. 
        Read the real estate listing text below and map the exact values into the JSON fields.

        CRITICAL WHITE-LABEL INSTRUCTIONS:
        1. You MUST REMOVE any mentions of the original agency names (e.g., 'Zaryab Mark & Developers'), agent names, and phone numbers from the "title", "description", and "criticalNotes".
        2. Rewrite those specific sentences to be neutral (e.g., change "Zaryab Mark offers..." to "We offer...").
        3. Extract the original agency's name and phone number ONLY into the hidden "sourceAgencyName" and "sourcePhone" fields so the admin can contact them later.

        Required JSON Schema:
        {
          "title": "String (The exact title, SCRUBBED of any agency branding)",
          "description": "String (The full property description, SCRUBBED of any agency names, agent names, and phone numbers)",
          "price": "Number (Raw digits only, e.g., 10000000)",
          "priceFormatted": "String (e.g., '4.35 Crore')",
          "size": "String (e.g., '7.6 Marla' or '2000 Sq. Ft.')",
          "bedrooms": "Number (Extract the integer for beds)",
          "bathrooms": "Number (Extract the integer for baths)",
          "location": "String (The specific block, phase, or area)",
          "city": "String (Extract city, or default to Lahore)",
          "category": "String (Must be one of: Home, Plot, Commercial, Flats)",
          "subCategory": "String (Must be one of: House, Apartment, Shop, Residential Plot)",
          "purpose": "String (Must be one of: buy, rent)",
          "paymentMode": "String (Must be one of: Cash, Installment)",
          "criticalNotes": "String (Key selling points, SCRUBBED of branding)",
          "sourcePhone": "String (Extract the original agent/agency phone or WhatsApp number. If none, leave empty)",
          "sourceAgencyName": "String (Extract the original agency or developer name. If none, leave empty)"
        }

        Raw Listing Text to Extract From:
        "${textToAnalyze}"
      `;

      let parsedData;
      try {
        const result = await model.generateContent(prompt);
        parsedData = JSON.parse(result.response.text());
      } catch (aiError) {
        console.error(`🚨 Gemini Parsing Failed for block ${i}:`, aiError);
        throw new Error(`AI Data Extraction failed for block ${i + 1}`);
      }

      // ==========================================
      // PIPELINE B: MULTIPLE IMAGE GCS UPLOAD
      // ==========================================
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueFilename = `properties/ai-bulk/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const blob = bucket.file(uniqueFilename);

        await blob.save(buffer, {
          metadata: { contentType: file.type },
        });

        uploadedUrls.push(`https://storage.googleapis.com/${bucketName}/${uniqueFilename}`);
      }

      // ==========================================
      // PIPELINE C: DATABASE INJECTION
      // ==========================================
      // 🚀 NEW: Package the source phone and agency name together for the admin
      const hiddenAdminContact = parsedData.sourcePhone || parsedData.sourceAgencyName 
        ? `${parsedData.sourcePhone || "No Phone"} (${parsedData.sourceAgencyName || "Unknown Agency"})` 
        : null;

      const newProperty = await prisma.property.create({
        data: {
          title: parsedData.title || "Untitled Property",
          description: parsedData.description || "",
          price: Number(parsedData.price) || 0,
          priceFormatted: parsedData.priceFormatted || "Contact for Price",
          size: parsedData.size || "Size not listed",
          bedrooms: Number(parsedData.bedrooms) || 0,
          bathrooms: Number(parsedData.bathrooms) || 0,
          location: parsedData.location || "Lahore",
          city: parsedData.city || "Lahore",
          category: parsedData.category || "Home",
          subCategory: parsedData.subCategory || "Apartment",
          purpose: parsedData.purpose || "buy",
          paymentMode: parsedData.paymentMode || "Cash",
          criticalNotes: parsedData.criticalNotes || "",
          imageUrl: uploadedUrls[0], 
          imageUrls: uploadedUrls,   
          agencyName: "LPG Premium (AI Sourced)",
          submittedBy: "AI Bulk Engine",
          isFeatured: false,
          sourcePhone: hiddenAdminContact, // 🚀 Saved to DB secretly
        }
      });
      successfullyProcessed.push(newProperty.title);
      console.log(`✅ Success: ${newProperty.title} injected into DB.`);
    }

    return NextResponse.json({
      success: true,
      processedCount: successfullyProcessed.length,
      titles: successfullyProcessed
    }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 Bulk Import Orchestrator Failed:", error.message);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}