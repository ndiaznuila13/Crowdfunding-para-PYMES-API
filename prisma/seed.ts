import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el sembrado de base de datos (seeding)...');

  // Crear usuario con rol PYME
  const pymeUser = await prisma.user.upsert({
    where: { email: 'pyme@example.com' },
    update: {},
    create: {
      email: 'pyme@example.com',
      password: 'password_pyme', // En producción se debe hashear
      role: Role.PYME,
      balance: 1000.0,
    },
  });
  console.log(`Usuario PYME registrado: ${pymeUser.email} (ID: ${pymeUser.id})`);

  // Crear otro usuario con rol PYME (para pruebas de propiedad)
  const pymeUser2 = await prisma.user.upsert({
    where: { email: 'pyme2@example.com' },
    update: {},
    create: {
      email: 'pyme2@example.com',
      password: 'password_pyme2',
      role: Role.PYME,
      balance: 500.0,
    },
  });
  console.log(`Segundo Usuario PYME registrado: ${pymeUser2.email} (ID: ${pymeUser2.id})`);

  // Crear usuario con rol INVESTOR
  const investorUser = await prisma.user.upsert({
    where: { email: 'investor@example.com' },
    update: {},
    create: {
      email: 'investor@example.com',
      password: 'password_investor',
      role: Role.INVESTOR,
      balance: 50000.0,
    },
  });
  console.log(`Usuario INVESTOR registrado: ${investorUser.email} (ID: ${investorUser.id})`);

  // Crear usuario con rol ADMIN
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: 'password_admin',
      role: Role.ADMIN,
      balance: 0.0,
    },
  });
  console.log(`Usuario ADMIN registrado: ${adminUser.email} (ID: ${adminUser.id})`);

  console.log('Proceso de sembrado (seeding) terminado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
