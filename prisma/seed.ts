import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Secure, zero-dependency password hasher (Matches your Next.js auth route)
const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function main() {
  console.log('🌱 Start seeding...');

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

  // 2. SEED PROPERTIES (Without duplicates)
  const properties = [
    {
      title: 'Luxury Villa in Gulberg',
      description: 'A beautiful luxury 5-bedroom villa located in the heart of Gulberg III with top-tier amenities.',
      price: 85000000,
      priceFormatted: '8.5 Cr',
      size: '2 Kanal',
      bedrooms: 5,
      bathrooms: 6,
      location: 'Main Boulevard, Gulberg III',
      city: 'Lahore',
      imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
      purpose: 'buy',
      category: 'Residential',
      subCategory: 'House',
      isFeatured: true,
      agencyName: 'LPG Premium'
    },
    {
      title: 'Modern Apartment - DHA Phase 6',
      description: 'Stunning modern apartment situated in Raya Fairways with breathtaking golf course views.',
      price: 25000000,
      priceFormatted: '2.5 Cr',
      size: '10 Marla',
      bedrooms: 3,
      bathrooms: 3,
      location: 'Raya Fairways',
      city: 'Lahore',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
      purpose: 'buy',
      category: 'Residential',
      subCategory: 'Apartment',
      isFeatured: false,
      agencyName: 'LPG Premium'
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

  console.log('🌲 Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });