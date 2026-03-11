import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "LPG_SUPER_SECRET_KEY_2026_PRODUCTION");

// Define which routes require which roles
const protectedRoutes = {
  "/command-center": ["MASTER_ADMIN"],
  "/dashboard": ["AGENCY_PARTNER", "MASTER_ADMIN"], 
  "/user-dashboard": ["USER", "AGENCY_PARTNER", "MASTER_ADMIN"],
};

// 🚀 RENAMED: Changed from "middleware" to "proxy" for Next.js 16+ compatibility
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requiredRoles = Object.entries(protectedRoutes).find(([route]) => pathname.startsWith(route))?.[1];

  if (!requiredRoles) {
    return NextResponse.next();
  }

  const token = req.cookies.get("lpg_auth_session")?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname); 
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    if (!requiredRoles.includes(userRole)) {
      if (userRole === "MASTER_ADMIN") return NextResponse.redirect(new URL('/command-center', req.url));
      if (userRole === "AGENCY_PARTNER") return NextResponse.redirect(new URL('/dashboard', req.url));
      return NextResponse.redirect(new URL('/user-dashboard', req.url));
    }

    const response = NextResponse.next();
    response.headers.set('x-user-role', userRole);
    if (payload.userId) response.headers.set('x-user-id', payload.userId as string);
    if (payload.agencyName) response.headers.set('x-agency-name', payload.agencyName as string);

    return response;

  } catch (error) {
    const loginUrl = new URL('/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("lpg_auth_session");
    return response;
  }
}

export const config = {
  matcher: [
    '/command-center/:path*',
    '/dashboard/:path*',
    '/user-dashboard/:path*',
  ],
};