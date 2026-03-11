import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(properties);
  } catch (error) { return NextResponse.json({ error: "Failed to fetch" }, { status: 500 }); }
}

// 🚀 UPGRADED: Now handles both "Featured" toggles and Full Edits!
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body; 
    
    const updated = await prisma.property.update({ 
      where: { id }, 
      data: updateData 
    });
    return NextResponse.json(updated);
  } catch (error) { return NextResponse.json({ error: "Failed to update" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: "Failed to delete" }, { status: 500 }); }
}