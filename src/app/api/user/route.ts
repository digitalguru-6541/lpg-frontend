import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    // 1. Safest possible fetch. No complex orderBy or select that might crash Prisma.
    const users = await prisma.user.findMany();

    // 2. Safely map the data, strip the password, and explicitly format dates
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email || "No Email",
      role: user.role || "USER",
      agencyName: user.agencyName || "",
      // Prevent Next.js serialization crashes by converting Date to string
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
    }));

    // 3. Sort newest first using Javascript instead of the database to guarantee no crashes
    safeUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(safeUsers, { status: 200 });

  } catch (error) {
    console.error("🔥 FATAL GET Users Error:", error);
    // If it STILL fails, it will print the exact reason in your VS Code terminal
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, passwordHash, ...updates } = body;

    const dataToUpdate: any = { ...updates };
    if (passwordHash) {
      dataToUpdate.passwordHash = passwordHash;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });
    
    const { passwordHash: removedPw, ...safeUpdatedUser } = updatedUser;
    return NextResponse.json(safeUpdatedUser);
  } catch (error) {
    console.error("🔥 PATCH User Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.user.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 DELETE User Error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}