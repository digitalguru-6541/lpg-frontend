import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("lpg_auth_session")?.value;

    if (!token) {
      return NextResponse.json({ isLoggedIn: false }, { status: 200 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: payload.userId,
        name: payload.name,
        role: payload.role,
        agencyName: payload.agencyName
      }
    }, { status: 200 });

  } catch (error) {
    // If token is invalid or expired
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }
}