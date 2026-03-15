import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Secure, zero-dependency password hasher (Matches your Next.js auth route)
const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function main() {
  console.log('🌱 Start seeding Enterprise Data...');

  // 1. CREATE MASTER ADMIN USER
  const adminEmail = 'admin@lpg.com';
  const adminPassword = 'password123';
  const hashedPassword = hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword, // Ensures password is correct even if user exists
      role: 'MASTER_ADMIN',
      agencyName: 'LPG Premium',
    },
    create: {
      email: adminEmail,
      name: 'System Admin',
      passwordHash: hashedPassword,
      role: 'MASTER_ADMIN',
      phone: '+923000000000',
      agencyName: 'LPG Premium',
    },
  });

  console.log(`✅ Admin user ready. Login with: ${adminEmail} / ${adminPassword}`);

  // 2. SEED REAL INVENTORY (Zameen Data Extracted)
  const properties = [
    {
      title: "1 Bed Fully Furnished Apartment - Sky Luxe Tower",
      description: "Sector B, Bahria Town. 25% Down Payment. Fully furnished 1-bed apartment in Sky Luxe Tower with 10% discount.",
      purpose: "buy",
      category: "Flats",
      subCategory: "Standard Flat",
      price: 12500000,
      priceFormatted: "1.25 Cr",
      size: "600 Sq. Ft.",
      bedrooms: 1,
      bathrooms: 1,
      isFurnished: true,
      paymentMode: "Installment",
      installmentPlan: "25% Down Payment, Easy Installments",
      criticalNotes: "Competitor Zameen.com Listing. Offer 10% discount to close fast.",
      location: "Sector B, Bahria Town",
      city: "Lahore",
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
      isFeatured: true,
      agencyName: "Zameen Estate Partners", // Hidden by API Gatekeeper
      submittedBy: "Zameen Importer Engine",
      sourcePhone: "+923001234567" // Hidden by API Gatekeeper
    },
    {
      title: "1 Bed Apartment Madina Heights 4 - Safari Zoo View",
      description: "6th Floor, Madina Heights 4. Stunning Safari Zoo view in Bahria Town Sector B.",
      purpose: "buy",
      category: "Flats",
      subCategory: "Standard Flat",
      price: 8500000,
      priceFormatted: "85 Lakh",
      size: "550 Sq. Ft.",
      bedrooms: 1,
      bathrooms: 1,
      isFurnished: false,
      paymentMode: "Cash",
      installmentPlan: "",
      criticalNotes: "6th Floor. Highlight the Zoo view to families.",
      location: "Sector B, Bahria Town",
      city: "Lahore",
      imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1de2d9d00c?q=80&w=1200&auto=format&fit=crop",
      isFeatured: false,
      agencyName: "Bahria Real Estate", // Hidden by API Gatekeeper
      submittedBy: "Zameen Importer Engine",
      sourcePhone: "+923007654321" // Hidden by API Gatekeeper
    },
    {
      title: "1700 Sqft Modern 2-Bed Apartment - 18-Green Golf View",
      description: "Defence Raya, DHA Phase 6. Stunning golf view, premium modern finishing.",
      purpose: "buy",
      category: "Flats",
      subCategory: "Standard Flat",
      price: 45000000,
      priceFormatted: "4.5 Cr",
      size: "1700 Sq. Ft.",
      bedrooms: 2,
      bathrooms: 2,
      isFurnished: false,
      paymentMode: "Cash",
      installmentPlan: "",
      criticalNotes: "Premium listing. Target overseas Pakistanis looking for golf estate living.",
      location: "Defence Raya, DHA Phase 6",
      city: "Lahore",
      imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop",
      isFeatured: true,
      agencyName: "DHA Premium Estates", // Hidden by API Gatekeeper
      submittedBy: "Zameen Importer Engine",
      sourcePhone: "+923331112222" // Hidden by API Gatekeeper
    },
    {
      title: "1-Bed Apartment Near IT City & Defence Raya",
      description: "DHA Phase 6. Prime location near IT City and Defence Raya Golf Resort.",
      purpose: "buy",
      category: "Flats",
      subCategory: "Standard Flat",
      price: 22000000,
      priceFormatted: "2.2 Cr",
      size: "800 Sq. Ft.",
      bedrooms: 1,
      bathrooms: 1,
      isFurnished: false,
      paymentMode: "Cash",
      installmentPlan: "",
      criticalNotes: "High ROI potential due to IT City proximity. Great for tech investors.",
      location: "Defence Raya, DHA Phase 6",
      city: "Lahore",
      imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
      isFeatured: false,
      agencyName: "DHA Premium Estates", // Hidden by API Gatekeeper
      submittedBy: "Zameen Importer Engine",
      sourcePhone: "+923331112222" // Hidden by API Gatekeeper
    },
    {
      title: "3-Bed Facing Golf Apartment - 6th Floor Defence Raya",
      description: "Ultra-luxury 3-bedroom apartment facing the golf course on the 6th floor of Defence Raya.",
      purpose: "buy",
      category: "Flats",
      subCategory: "Penthouse",
      price: 85000000,
      priceFormatted: "8.5 Cr",
      size: "2400 Sq. Ft.",
      bedrooms: 3,
      bathrooms: 3,
      isFurnished: true,
      paymentMode: "Installment",
      installmentPlan: "Negotiable",
      criticalNotes: "VIP Listing. Keep strictly for High-Net-Worth buyers.",
      location: "Defence Raya, DHA Phase 6",
      city: "Lahore",
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
      isFeatured: true,
      agencyName: "Elite Property Portfolio", // Hidden by API Gatekeeper
      submittedBy: "Zameen Importer Engine",
      sourcePhone: "+923459998888" // Hidden by API Gatekeeper
    }
  ];

  for (const p of properties) {
    // Prevent duplicates by checking if a property with this title already exists
    const existingProp = await prisma.property.findFirst({
      where: { title: p.title }
    });

    if (!existingProp) {
      const property = await prisma.property.create({
        data: p,
      });
      console.log(`✅ Created property: ${property.title}`);
    } else {
      console.log(`⏭️ Skipped duplicate property: ${p.title}`);
    }
  }

  console.log('🌲 Seeding finished successfully. Database fortified.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });