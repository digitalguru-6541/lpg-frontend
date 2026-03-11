import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered. Please log in." }, { status: 400 });
    }

    // 2. Create the User
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password, // Note: Use bcrypt in production
        role: "USER" // Default role for public signups
      }
    });

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
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // 5. Create Response & Set HTTP-Only Cookie
    const response = NextResponse.json({ 
      success: true, 
      redirectUrl: "/user-dashboard" 
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
    console.error("Signup API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}