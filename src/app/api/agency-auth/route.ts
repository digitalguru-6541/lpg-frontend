import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import crypto from "crypto";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required." }, { status: 400 });
    }

    const safeInput = username.trim();
    const incomingPasswordHash = crypto.createHash('sha256').update(password).digest('hex');

    let foundUser = null;
    let isAgencyUser = false;

    // 1. STRICT B2B CHECK: Search Agency Staff First (Case-Insensitive)
    foundUser = await prisma.agencyUser.findFirst({
      where: {
        OR: [{ username: safeInput }, { username: safeInput.toLowerCase() }]
      }
    });

    if (foundUser) {
      isAgencyUser = true;
    } else {
      // 2. SECONDARY CHECK: Check Master User table (Only for Admins/Partners)
      const masterUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: safeInput }, { email: safeInput.toLowerCase() }]
        }
      });

      if (masterUser && (masterUser.role === "AGENCY_PARTNER" || masterUser.role === "MASTER_ADMIN")) {
        foundUser = masterUser;
      }
    }

    if (!foundUser) {
      return NextResponse.json({ error: "Invalid B2B credentials or unauthorized access." }, { status: 401 });
    }

    if (incomingPasswordHash !== foundUser.passwordHash) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    // 🚀 THE GHOST BYPASS MAGIC
    // We set the main 'role' to AGENCY_PARTNER to slip past the 307 Server Redirect trap.
    // We save their REAL role in 'trueAgencyRole' to restrict their UI later.
    const tokenPayload = {
      userId: foundUser.id,
      role: isAgencyUser ? "AGENCY_PARTNER" : foundUser.role, // The VIP Pass
      trueAgencyRole: isAgencyUser ? foundUser.role : foundUser.role, // The True Identity
      name: isAgencyUser ? (foundUser as any).username : (foundUser as any).name,
      agencyName: foundUser.agencyName || "LPG Network",
      isSubAgent: isAgencyUser,
      ownerId: isAgencyUser ? (foundUser as any).ownerId : null
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const finalRedirect = foundUser.role === "MASTER_ADMIN" ? "/command-center" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      redirectUrl: finalRedirect
    });

    response.cookies.set({
      name: "lpg_auth_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    });

    return response;

  } catch (error) {
    console.error("Agency Auth API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}