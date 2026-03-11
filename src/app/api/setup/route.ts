import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    // 1. Setup MASTER_ADMIN
    const admin = await prisma.user.upsert({
      where: { email: "admin@lpg.com" },
      update: {},
      create: {
        name: "System Admin",
        email: "admin@lpg.com",
        passwordHash: "admin123", // Note: Plain text for this simulation phase
        role: "MASTER_ADMIN",
      },
    });

    // 2. Setup AGENCY_PARTNER
    const agency = await prisma.user.upsert({
      where: { email: "agency@cdb.com" },
      update: {},
      create: {
        name: "CDB Manager",
        email: "agency@cdb.com",
        passwordHash: "agency123",
        role: "AGENCY_PARTNER",
        agencyName: "CDB Properties",
      },
    });

    // 3. Setup Regular USER
    const user = await prisma.user.upsert({
      where: { email: "investor@test.com" },
      update: {},
      create: {
        name: "Ahmed Raza",
        email: "investor@test.com",
        passwordHash: "user123",
        role: "USER",
      },
    });

    return NextResponse.json({
      message: "✅ Database seeded successfully. You can now test the login flow.",
      testCredentials: [
        { role: "MASTER_ADMIN", email: "admin@lpg.com", password: "admin123", routesTo: "/command-center" },
        { role: "AGENCY_PARTNER", email: "agency@cdb.com", password: "agency123", routesTo: "/dashboard" },
        { role: "USER", email: "investor@test.com", password: "user123", routesTo: "/user-dashboard" }
      ]
    });

  } catch (error) {
    console.error("Setup Error:", error);
    return NextResponse.json({ error: "Failed to seed database." }, { status: 500 });
  }
}