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
        username: payload.name,
        // 🚀 DECODE THE GHOST BYPASS: Feed the frontend the true role
        role: payload.trueAgencyRole || payload.role,
        agencyName: payload.agencyName,
        isSubAgent: payload.isSubAgent || false
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }
}