import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

// Helper function to extract user ID from secure cookie
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("lpg_auth_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// CHECK IF PROPERTY IS SAVED
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("propertyId");
    if (!propertyId) return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });

    const userId = await getUserId();
    if (!userId) return NextResponse.json({ isSaved: false }); // Not logged in = not saved

    const saved = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: { userId, propertyId }
      }
    });

    return NextResponse.json({ isSaved: !!saved });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// SAVE A PROPERTY
export async function POST(req: Request) {
  try {
    const { propertyId } = await req.json();
    const userId = await getUserId();
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.savedProperty.create({
      data: { userId, propertyId }
    });

    return NextResponse.json({ success: true, isSaved: true });
  } catch (error) {
    console.error("Save Property Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// UNSAVE A PROPERTY
export async function DELETE(req: Request) {
  try {
    const { propertyId } = await req.json();
    const userId = await getUserId();
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.savedProperty.deleteMany({
      where: { userId, propertyId }
    });

    return NextResponse.json({ success: true, isSaved: false });
  } catch (error) {
    console.error("Unsave Property Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}