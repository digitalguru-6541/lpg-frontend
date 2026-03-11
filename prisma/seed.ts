import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
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
      subCategory: 'House',      // <-- Added missing field
      isFeatured: true
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
      subCategory: 'Apartment',  // <-- Added missing field
      isFeatured: false
    }
  ];

  for (const p of properties) {
    const property = await prisma.property.create({
      data: p,
    });
    console.log(`Created property with id: ${property.id}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });