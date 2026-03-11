import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Storage } from '@google-cloud/storage';

// 🚀 BULLETPROOF FIX: Inline Prisma initialization
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

// 🚀 CONFIGURE GOOGLE CLOUD STORAGE
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'), 
  }
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

// Helper function to upload base64 to Google Cloud Storage
async function uploadToGCS(base64String: string, folder: string): Promise<string> {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const mimeTypeMatch = base64String.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
  const extension = mimeType.split('/')[1] || "jpg";
  const fileName = `${folder}/prop_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
  
  const file = bucket.file(fileName);
  const buffer = Buffer.from(base64Data, 'base64');
  
  await file.save(buffer, {
    metadata: { contentType: mimeType },
  });
  
  return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;
}

// 🚀 GET: Fetch properties
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agencyName = searchParams.get('agencyName');
    const query = agencyName ? { where: { agencyName } } : {};

    const properties = await prisma.property.findMany({
      ...query,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

// 🚀 POST: Upload a new property (MULTI-IMAGE ENABLED)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let finalImageUrls: string[] = [];

    // 🚀 CONCURRENT CLOUD UPLOADS: Uploads all 12 images at exactly the same time!
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      const uploadPromises = body.images.map(async (img: string) => {
        if (img.startsWith('data:image')) {
          return await uploadToGCS(img, 'properties');
        }
        return img;
      });
      
      finalImageUrls = await Promise.all(uploadPromises);
    }

    const newProperty = await prisma.property.create({
      data: {
        title: body.title,
        description: body.description,
        purpose: body.purpose,
        category: body.category, 
        subCategory: body.subCategory, 
        price: parseFloat(body.price),
        priceFormatted: body.priceFormatted,
        size: body.size,
        bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
        bathrooms: body.bathrooms ? parseInt(body.bathrooms) : null,
        isFurnished: body.isFurnished,
        paymentMode: body.paymentMode || "Cash",
        installmentPlan: body.paymentMode === "Installment" ? body.installmentPlan : null,
        criticalNotes: body.criticalNotes || null,
        location: body.location,
        city: body.city || "Lahore",
        
        // Save the first image as the main thumbnail, and save the whole array for the gallery!
        imageUrl: finalImageUrls.length > 0 ? finalImageUrls[0] : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800",
        imageUrls: finalImageUrls, 
        
        videoUrl: body.videoUrl || null,
        agencyName: body.agencyName || "LPG Premium", 
        submittedBy: body.submittedBy || "System",
        isFeatured: body.isFeatured || false,
      }
    });

    return NextResponse.json({ success: true, property: newProperty });
  } catch (error) {
    console.error("Failed to upload property:", error);
    return NextResponse.json({ error: "Failed to upload property" }, { status: 500 });
  }
}

// 🚀 DELETE: Permanently delete a property
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Property ID is required" }, { status: 400 });

    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ message: "Property permanently deleted" });
  } catch (error) {
    console.error("Failed to delete property:", error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}

// 🚀 PATCH: Update an existing property
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "Property ID is required" }, { status: 400 });

    let finalImageUrls = updateData.imageUrls || [];

    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      const uploadPromises = updateData.images.map(async (img: string) => {
        if (img.startsWith('data:image')) {
          return await uploadToGCS(img, 'properties');
        }
        return img;
      });
      finalImageUrls = await Promise.all(uploadPromises);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        purpose: updateData.purpose,
        category: updateData.category,
        subCategory: updateData.subCategory,
        price: updateData.price ? parseFloat(updateData.price) : undefined,
        priceFormatted: updateData.priceFormatted,
        size: updateData.size,
        bedrooms: updateData.bedrooms ? parseInt(updateData.bedrooms) : null,
        bathrooms: updateData.bathrooms ? parseInt(updateData.bathrooms) : null,
        isFurnished: updateData.isFurnished,
        paymentMode: updateData.paymentMode,
        installmentPlan: updateData.paymentMode === "Installment" ? updateData.installmentPlan : null,
        criticalNotes: updateData.criticalNotes,
        location: updateData.location,
        city: updateData.city,
        
        imageUrl: finalImageUrls.length > 0 ? finalImageUrls[0] : updateData.imageUrl, 
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        
        videoUrl: updateData.videoUrl || null, 
      }
    });

    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error("Failed to update property:", error);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}