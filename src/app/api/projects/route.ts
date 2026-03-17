import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const projects = await prisma.megaProject.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const project = await prisma.megaProject.create({
      data: {
        title: data.title, slug: data.slug, location: data.location,
        startingPrice: data.startingPrice, estRoi: data.estRoi, agencyName: data.agencyName,
        coverImage: data.coverImage, galleryImages: data.galleryImages || [],
        projectType: data.projectType, totalFloors: data.totalFloors, possessionDate: data.possessionDate,
        description: data.description, customFeatures: data.customFeatures || [],
        videoUrl: data.videoUrl || null, // 🚀 Saves the video URL
      }
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "URL slug already exists." }, { status: 400 });
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const project = await prisma.megaProject.update({
      where: { id: data.id },
      data: {
        title: data.title, slug: data.slug, location: data.location,
        startingPrice: data.startingPrice, estRoi: data.estRoi, agencyName: data.agencyName,
        coverImage: data.coverImage, galleryImages: data.galleryImages || [],
        projectType: data.projectType, totalFloors: data.totalFloors, possessionDate: data.possessionDate,
        description: data.description, customFeatures: data.customFeatures || [],
        videoUrl: data.videoUrl || null, // 🚀 Updates the video URL
      }
    });
    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.megaProject.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}