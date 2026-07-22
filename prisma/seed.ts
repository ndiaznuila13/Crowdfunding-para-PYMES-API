import 'dotenv/config';
import { PrismaClient, Role, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log('Iniciando el sembrado de base de datos (seeding)...');

  const demoPassword = 'Password123';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const pymeUser = await prisma.user.upsert({
    where: { email: 'pyme@example.com' },
    update: { password: passwordHash, role: Role.PYME },
    create: {
      email: 'pyme@example.com',
      password: passwordHash,
      role: Role.PYME,
      balance: 1000.0,
    },
  });
  console.log(
    `Usuario PYME registrado: ${pymeUser.email} (ID: ${pymeUser.id})`,
  );

  const pymeUser2 = await prisma.user.upsert({
    where: { email: 'pyme2@example.com' },
    update: { password: passwordHash, role: Role.PYME },
    create: {
      email: 'pyme2@example.com',
      password: passwordHash,
      role: Role.PYME,
      balance: 500.0,
    },
  });
  console.log(
    `Segundo Usuario PYME registrado: ${pymeUser2.email} (ID: ${pymeUser2.id})`,
  );

  const investorUser = await prisma.user.upsert({
    where: { email: 'investor@example.com' },
    update: { password: passwordHash, role: Role.INVESTOR },
    create: {
      email: 'investor@example.com',
      password: passwordHash,
      role: Role.INVESTOR,
      balance: 50000.0,
    },
  });
  console.log(
    `Usuario INVESTOR registrado: ${investorUser.email} (ID: ${investorUser.id})`,
  );

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: passwordHash, role: Role.ADMIN },
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      role: Role.ADMIN,
      balance: 0.0,
    },
  });
  console.log(
    `Usuario ADMIN registrado: ${adminUser.email} (ID: ${adminUser.id})`,
  );

  const nextYear = new Date();
  nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
  const lastYear = new Date();
  lastYear.setUTCFullYear(lastYear.getUTCFullYear() - 1);

  const activeProjectData = {
    title: 'Energía solar para Panadería Central',
    description:
      'Instalación de paneles solares para reducir costos de producción.',
    fundingGoal: 25000,
    currentFunding: 5000,
    deadline: nextYear,
    returnRate: 0.12,
    status: Status.ACTIVE,
    ownerId: pymeUser.id,
  };
  const existingActiveProject = await prisma.project.findFirst({
    where: { title: activeProjectData.title, ownerId: pymeUser.id },
  });
  const activeProject = existingActiveProject
    ? await prisma.project.update({
        where: { id: existingActiveProject.id },
        data: activeProjectData,
      })
    : await prisma.project.create({ data: activeProjectData });

  const completedProjectData = {
    title: 'Ampliación de Cafetería Demo',
    description:
      'Proyecto completado que permite demostrar el historial de retornos.',
    fundingGoal: 10000,
    currentFunding: 10000,
    deadline: lastYear,
    returnRate: 0.1,
    status: Status.COMPLETED,
    ownerId: pymeUser2.id,
  };
  const existingCompletedProject = await prisma.project.findFirst({
    where: { title: completedProjectData.title, ownerId: pymeUser2.id },
  });
  const completedProject = existingCompletedProject
    ? await prisma.project.update({
        where: { id: existingCompletedProject.id },
        data: completedProjectData,
      })
    : await prisma.project.create({ data: completedProjectData });

  const demoInvestments = [
    { projectId: activeProject.id, amount: 5000 },
    { projectId: completedProject.id, amount: 2000 },
  ];
  for (const investmentData of demoInvestments) {
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        userId: investorUser.id,
        projectId: investmentData.projectId,
      },
    });
    if (existingInvestment) {
      await prisma.investment.update({
        where: { id: existingInvestment.id },
        data: { amount: investmentData.amount },
      });
    } else {
      await prisma.investment.create({
        data: { userId: investorUser.id, ...investmentData },
      });
    }
  }

  console.log(
    `Datos demo listos. Contraseña para todos los usuarios: ${demoPassword}`,
  );

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
