import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma"; // Ensure this is exactly 3 dots!

// Fetch active ads for the homepage
export async function GET() {
  try {
    const ads = await prisma.adCampaign.findMany({
      where: { status: "Active" },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(ads);
  } catch (error) {
    console.error("Failed to fetch ads:", error);
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
  }
}

// Save a newly deployed ad from the Command Center
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newAd = await prisma.adCampaign.create({
      data: {
        title: body.title,
        imageUrl: body.imageUrl,
        placement: body.placement,
        revenue: parseFloat(body.revenue) || 0,
        status: "Active"
      }
    });
    return NextResponse.json({ success: true, ad: newAd });
  } catch (error) {
    console.error("Failed to create ad:", error);
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}