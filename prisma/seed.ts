import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@buynsell.ph' },
    update: {},
    create: {
      email: 'admin@buynsell.ph',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
      tier: 'PREMIUM',
    },
  });

  console.log('Admin user created:', admin.email);

  // Create agent user
  const agentPassword = await bcrypt.hash('agent123', 10);

  const agent = await prisma.user.upsert({
    where: { email: 'agent@buynsell.ph' },
    update: {},
    create: {
      email: 'agent@buynsell.ph',
      name: 'Test Agent',
      password: agentPassword,
      role: 'AGENT',
      tier: 'GOLD',
      agentProfile: {
        create: {
          bio: 'Experienced real estate agent',
          licenseNumber: 'PRC-12345',
          specialization: ['Residential', 'Commercial'],
          yearsExperience: 5,
        },
      },
    },
  });

  console.log('Agent user created:', agent.email);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'user@buynsell.ph' },
    update: {},
    create: {
      email: 'user@buynsell.ph',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
      tier: 'GREEN',
    },
  });

  console.log('Regular user created:', user.email);

  // Create sample listings for testing
  const sampleListings = [
    {
      title: 'Modern Condo in BGC',
      description: 'Luxurious 2-bedroom condo with stunning city views',
      price: 15000000,
      transactionType: 'SALE' as const,
      propertyType: 'CONDO' as const,
      address: '32nd Street, BGC',
      city: 'Taguig',
      latitude: 14.5547,
      longitude: 121.0509,
      area: 85,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      mainImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      status: 'APPROVED' as const,
      isFeatured: true,
    },
    {
      title: 'Spacious House in Makati',
      description: 'Beautiful 4-bedroom house with garden',
      price: 45000000,
      transactionType: 'SALE' as const,
      propertyType: 'HOUSE' as const,
      address: 'San Lorenzo Village',
      city: 'Makati',
      latitude: 14.5538,
      longitude: 121.0195,
      area: 350,
      bedrooms: 4,
      bathrooms: 3,
      parking: 2,
      mainImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      status: 'APPROVED' as const,
      isFeatured: true,
    },
    {
      title: 'Studio for Rent in Ortigas',
      description: 'Fully furnished studio near MRT',
      price: 25000,
      transactionType: 'RENT' as const,
      propertyType: 'CONDO' as const,
      address: 'Ortigas Center',
      city: 'Pasig',
      latitude: 14.5876,
      longitude: 121.0614,
      area: 32,
      bedrooms: 1,
      bathrooms: 1,
      parking: 0,
      mainImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      status: 'APPROVED' as const,
      isFeatured: false,
    },
    {
      title: 'Commercial Space in Quezon City',
      description: 'Prime location for business',
      price: 85000,
      transactionType: 'RENT' as const,
      propertyType: 'COMMERCIAL' as const,
      address: 'Tomas Morato Avenue',
      city: 'Quezon City',
      latitude: 14.6312,
      longitude: 121.0345,
      area: 120,
      bedrooms: 0,
      bathrooms: 2,
      parking: 3,
      mainImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      status: 'APPROVED' as const,
      isFeatured: true,
    },
    {
      title: 'Townhouse in Alabang',
      description: '3-storey townhouse in gated community',
      price: 18500000,
      transactionType: 'SALE' as const,
      propertyType: 'TOWNHOUSE' as const,
      address: 'Filinvest City',
      city: 'Muntinlupa',
      latitude: 14.4167,
      longitude: 121.0285,
      area: 180,
      bedrooms: 3,
      bathrooms: 3,
      parking: 2,
      mainImage: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
      status: 'APPROVED' as const,
      isFeatured: false,
    },
    {
      title: 'Vacant Lot in Tagaytay',
      description: 'Perfect for vacation home with cool weather',
      price: 5500000,
      transactionType: 'SALE' as const,
      propertyType: 'LOT' as const,
      address: 'Tagaytay Highlands',
      city: 'Tagaytay',
      latitude: 14.1153,
      longitude: 120.9621,
      area: 500,
      bedrooms: 0,
      bathrooms: 0,
      parking: 0,
      mainImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      status: 'APPROVED' as const,
      isFeatured: false,
    },
  ];

  // Get the agent ID
  const agentUser = await prisma.user.findUnique({ where: { email: 'agent@buynsell.ph' } });

  if (agentUser) {
    for (const listing of sampleListings) {
      await prisma.listing.upsert({
        where: { id: `seed-${listing.title.replace(/\s+/g, '-').toLowerCase()}` },
        update: {},
        create: {
          id: `seed-${listing.title.replace(/\s+/g, '-').toLowerCase()}`,
          ...listing,
          agentId: agentUser.id,
        },
      });
    }
    console.log(`Created ${sampleListings.length} sample listings`);
  }

  console.log('\n=== Login Credentials ===');
  console.log('Admin: admin@buynsell.ph / admin123');
  console.log('Agent: agent@buynsell.ph / agent123');
  console.log('User:  user@buynsell.ph / user123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
