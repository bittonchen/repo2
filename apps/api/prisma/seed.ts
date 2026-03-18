import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-clinic' },
    update: {},
    create: {
      name: 'קליניקה לדוגמה',
      slug: 'demo-clinic',
      email: 'demo@vetflow.co.il',
      phone: '03-1234567',
      address: 'רחוב הרצל 1, תל אביב',
      settings: {
        currency: 'ILS',
        timezone: 'Asia/Jerusalem',
        locale: 'he',
        appointmentDuration: 30,
        workingHours: {
          sunday: { start: '08:00', end: '18:00' },
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '14:00' },
          saturday: null,
        },
      },
    },
  });

  // Create demo owner
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@vetflow.co.il' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'demo@vetflow.co.il',
      passwordHash,
      name: 'ד"ר דמו ישראלי',
      phone: '050-1234567',
      role: 'owner',
    },
  });

  // Create a vet user
  const vet = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'vet@vetflow.co.il' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'vet@vetflow.co.il',
      passwordHash,
      name: 'ד"ר שרה כהן',
      phone: '050-9876543',
      role: 'veterinarian',
    },
  });

  // Create demo clients
  const client1 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      firstName: 'משה',
      lastName: 'לוי',
      phone: '052-1111111',
      email: 'moshe@example.com',
      address: 'רחוב ביאליק 5, רמת גן',
      idNumber: '012345678',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      firstName: 'רחל',
      lastName: 'כהן',
      phone: '054-2222222',
      email: 'rachel@example.com',
      address: 'רחוב דיזנגוף 100, תל אביב',
      idNumber: '098765432',
    },
  });

  // Create demo animals
  const animal1 = await prisma.animal.create({
    data: {
      tenantId: tenant.id,
      clientId: client1.id,
      name: 'רקס',
      species: 'dog',
      breed: 'גולדן רטריבר',
      gender: 'male',
      dateOfBirth: new Date('2020-03-15'),
      weight: 30,
      isNeutered: true,
      microchipNumber: '900118000123456',
    },
  });

  const animal2 = await prisma.animal.create({
    data: {
      tenantId: tenant.id,
      clientId: client2.id,
      name: 'מיצי',
      species: 'cat',
      breed: 'פרסי',
      gender: 'female',
      dateOfBirth: new Date('2021-07-20'),
      weight: 4.5,
      isNeutered: true,
    },
  });

  // Create demo inventory items
  await prisma.inventoryItem.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'אמוקסיצילין 250mg',
        category: 'medication',
        quantity: 50,
        minQuantity: 10,
        unitPrice: 45,
        costPrice: 25,
      },
      {
        tenantId: tenant.id,
        name: 'חיסון כלבת',
        category: 'medication',
        quantity: 20,
        minQuantity: 5,
        unitPrice: 120,
        costPrice: 80,
      },
      {
        tenantId: tenant.id,
        name: 'מזון Royal Canin כלב 15kg',
        category: 'food',
        quantity: 8,
        minQuantity: 3,
        unitPrice: 320,
        costPrice: 220,
      },
    ],
  });

  // Create a demo appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(30);

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      clientId: client1.id,
      animalId: animal1.id,
      veterinarianId: vet.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      type: 'ביקורת שגרתית',
      status: 'confirmed',
    },
  });

  console.log('Seed completed!');
  console.log(`Demo login: demo@vetflow.co.il / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
