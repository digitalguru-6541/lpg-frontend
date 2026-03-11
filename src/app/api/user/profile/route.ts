import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

export async function GET() {
  try {
    // 1. Get the session cookie securely
    const cookieStore = await cookies();
    const token = cookieStore.get("lpg_auth_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Decode the JWT to get the exact User ID
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    // 3. Fetch the User, their Inquiries (Leads), and their Wishlist (SavedProps)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' }
        },
        savedProps: {
          include: {
            property: true // Join the actual property details
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Format the response
    return NextResponse.json({
      user: { name: user.name, email: user.email },
      inquiries: user.leads,
      savedProperties: user.savedProps.map(sp => sp.property)
    });

  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}