import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF FIX: Inline Prisma initialization to prevent hot-reloading crashes
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
   
    // 1. Fetch the exact property
    const property = await prisma.property.findUnique({
      where: { id: resolvedParams.id }
    });
   
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // 2. Fetch up to 5 Similar Properties (excluding the current one)
    const similarProperties = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        OR: [
          { location: property.location },
          { category: property.category }
        ]
      },
      take: 5,
    });
   
    return NextResponse.json({ property, similarProperties });
  } catch (error) {
    console.error("Failed to fetch property:", error);
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}