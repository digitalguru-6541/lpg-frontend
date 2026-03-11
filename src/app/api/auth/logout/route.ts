import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // This forcefully expires the cookie immediately
  response.cookies.set({
    name: "lpg_auth_session",
    value: "",
    expires: new Date(0),
    path: "/",
  });

  return response;
}