import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import crypto from "crypto"; // Added crypto to match the seed file

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // 1. Database Lookup
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // 2. Secure Password Verification
    // We encrypt the incoming password to see if it matches the encrypted password in the database
    const incomingPasswordHash = crypto.createHash('sha256').update(password).digest('hex');
    const isMatch = incomingPasswordHash === user.passwordHash;

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // 3. Construct the JWT Payload
    const tokenPayload = {
      userId: user.id,
      role: user.role,
      name: user.name,
      agencyName: user.agencyName
    };

    // 4. Sign the Token
    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h") // Token expires in 24 hours
      .sign(JWT_SECRET);

    // 5. Create Response & Set HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      role: user.role,
      redirectUrl: user.role === "MASTER_ADMIN" ? "/command-center" : 
                   user.role === "AGENCY_PARTNER" ? "/dashboard" : "/user-dashboard"
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
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}