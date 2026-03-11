import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma"; // Make sure this path uses 3 dots!

export async function POST(req: Request) {
  try {
    const { properties } = await req.json();

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    let successCount = 0;

    for (const item of properties) {
      try {
        await prisma.property.create({
          data: {
            title: item.title,
            description: item.description,
            purpose: item.purpose,
            category: item.category,
            subCategory: item.subCategory,
            price: item.price,
            priceFormatted: item.priceFormatted,
            size: item.size,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            isFurnished: item.isFurnished,
            location: item.location,
            city: item.city,
            imageUrl: item.imageUrl,
            agencyName: item.agencyName,
            sourcePhone: item.sourcePhone, // The secret WhatsApp number!
            isFeatured: false,
          }
        });
        successCount++;
      } catch (err) {
        console.error("Skipped a property:", err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${successCount} out of ${properties.length} properties!` 
    });

  } catch (error) {
    console.error("Ingestion failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}