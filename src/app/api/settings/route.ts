import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
    if (!settings) settings = await prisma.systemSettings.create({ data: { id: "global" } });
    return NextResponse.json(settings);
  } catch (error) { return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await prisma.systemSettings.upsert({
      where: { id: "global" },
      update: body,
      create: { id: "global", ...body }
    });
    return NextResponse.json(updated);
  } catch (error) { return NextResponse.json({ error: "Failed to save settings" }, { status: 500 }); }
}