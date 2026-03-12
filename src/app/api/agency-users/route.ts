import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

// 🚀 BULLETPROOF PRISMA INITIALIZATION
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Secure, zero-dependency password hasher
const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// GET: Fetch all sub-agents
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get('ownerId');

    // If an ownerId is passed, fetch only their agents. Otherwise, fetch all.
   const users = await prisma.agencyUser.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Strip password hashes before sending to the frontend for security
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Failed to fetch agency users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Create a new sub-agent credential
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, role, agencyName, ownerId } = body;

    if (!username || !password || !ownerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await prisma.agencyUser.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const newUser = await prisma.agencyUser.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        role: role || "CALLER",
        agencyName: agencyName || "Unknown Agency",
        ownerId: ownerId
      }
    });

    const { passwordHash, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error("Failed to create agency user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// DELETE: Revoke sub-agent access
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.agencyUser.delete({
      where: { id }
    });

    return NextResponse.json({ message: "User access revoked successfully" });
  } catch (error) {
    console.error("Failed to delete agency user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}