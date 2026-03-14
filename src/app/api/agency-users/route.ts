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

    // 🛡️ SANITIZE: Ensure username is strictly lowercase to prevent case-sensitive duplicates
    const safeUsername = username.toLowerCase().trim();

    // 🛡️ GATEKEEPER 1: Check if username exists in the AgencyUser table
    const existingAgencyUser = await prisma.agencyUser.findUnique({ 
      where: { username: safeUsername } 
    });
    if (existingAgencyUser) {
      return NextResponse.json({ error: "Duplicate Error: This username is already taken by another agent." }, { status: 409 });
    }

    // 🛡️ GATEKEEPER 2: Check if username exists in the Master User table! (The Cross-Table Fix)
    const existingMasterUser = await prisma.user.findUnique({ 
      where: { email: safeUsername } 
    });
    if (existingMasterUser) {
      return NextResponse.json({ error: "Duplicate Error: This email is already registered as a Master Partner account." }, { status: 409 });
    }

    // 🟢 Proceed to create if both checks pass
    const newUser = await prisma.agencyUser.create({
      data: {
        username: safeUsername,
        passwordHash: hashPassword(password),
        role: role || "CALLER",
        agencyName: agencyName || "Unknown Agency",
        ownerId: ownerId
      }
    });

    const { passwordHash: removedPw, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
    
  } catch (error) {
    console.error("Failed to create agency user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// 🚀 NEW PATCH METHOD: Update an existing sub-agent securely
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, username, password, role } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const dataToUpdate: any = {};

    // If they are updating the username, we must run the Gatekeeper checks again!
    if (username) {
      const safeUsername = username.toLowerCase().trim();
      
      const existingAgencyUser = await prisma.agencyUser.findFirst({ 
        where: { username: safeUsername, NOT: { id: id } } 
      });
      const existingMasterUser = await prisma.user.findUnique({ 
        where: { email: safeUsername } 
      });

      if (existingAgencyUser || existingMasterUser) {
        return NextResponse.json({ error: "Duplicate Error: This username is already in use." }, { status: 409 });
      }
      dataToUpdate.username = safeUsername;
    }

    // Only update the password if a new one was actually typed in
    if (password && password.trim() !== "") {
      dataToUpdate.passwordHash = hashPassword(password);
    }

    if (role) {
      dataToUpdate.role = role;
    }

    const updatedUser = await prisma.agencyUser.update({
      where: { id },
      data: dataToUpdate
    });

    const { passwordHash: removedPw, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser, { status: 200 });

  } catch (error) {
    console.error("Failed to update agency user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
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