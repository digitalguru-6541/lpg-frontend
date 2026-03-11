import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF FIX: Inline Prisma initialization to prevent connection limits
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const lifestyles = await prisma.lifestyleCollection.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(lifestyles);
  } catch (error) { 
    return NextResponse.json({ error: "Failed to fetch lifestyles" }, { status: 500 }); 
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await prisma.lifestyleCollection.create({ data: body });
    return NextResponse.json(created);
  } catch (error) { 
    return NextResponse.json({ error: "Failed to create lifestyle collection" }, { status: 500 }); 
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.lifestyleCollection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json({ error: "Failed to delete lifestyle collection" }, { status: 500 }); 
  }
}