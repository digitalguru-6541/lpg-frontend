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

// 🚀 THE GATEKEEPER: Added POST method to safely create users and block duplicates
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, passwordHash, role, name, agencyName, phone } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const safeEmail = email.toLowerCase().trim();

    // 🛡️ STEP 1: Check for duplicate email BEFORE creating
    const existingUser = await prisma.user.findUnique({
      where: { email: safeEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Duplicate Error: This email is already registered in the system." },
        { status: 409 } // 409 Conflict
      );
    }

    // 🟢 STEP 2: Proceed with Safe Creation
    const newUser = await prisma.user.create({
      data: {
        email: safeEmail,
        passwordHash: passwordHash || "",
        role: role || "USER",
        name: name || safeEmail.split("@")[0],
        agencyName: agencyName || null,
        phone: phone || null
      }
    });

    const { passwordHash: removedPw, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });

  } catch (error) {
    console.error("🔥 FATAL POST User Error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
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