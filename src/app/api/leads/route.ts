import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF FIX: Inline Prisma initialization. No more relative path errors!
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

// 🚀 NEW: POST Route for Manual CRM Leads
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Safely map the incoming frontend payload to the Prisma database model
    const newLead = await prisma.lead.create({
      data: {
        name: body.name,
        phone: body.phone,
        location: body.location,
        budget: body.budget,
        purpose: body.purpose,
        category: body.category,
        subCategory: body.subCategory,
        intent: body.intent,
        handledBy: body.handledBy,
        manualSummary: body.manualSummary,
        source: body.source || "MANUAL", // Safely enforces the manual CRM tag
        score: body.score || 50,         // Default mid-tier score for walk-ins
        status: "new",                   // Drops it straight into the first Kanban column
        assignedAgency: body.assignedAgency || "Pending Assignment"
      }
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error("Failed to create manual CRM lead:", error);
    return NextResponse.json({ error: "Failed to create manual lead in database." }, { status: 500 });
  }
}