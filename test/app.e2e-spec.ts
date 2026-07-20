import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

interface RegistrationResponse {
  id: number;
}

interface LoginResponse {
  access_token: string;
}

interface ProjectResponse {
  id: number;
  status: string;
}

interface InvestmentResponse {
  amount: number;
}

interface DashboardResponse {
  investorId: number;
  summary: {
    activeInvestmentsTotal: number;
    activeProjectsCount: number;
    estimatedIrrPercentage: number | null;
  };
  activeInvestments: Array<{
    projectId: number;
    amount: number;
    offeredReturnRatePercentage: number;
    estimatedReturn: number;
  }>;
  returnHistory: unknown[];
}

describe('Crowdfunding API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${process.pid}`;
  const investorEmail = `e2e-investor-${suffix}@example.com`;
  const pymeEmail = `e2e-pyme-${suffix}@example.com`;
  const password = 'Password123';
  const createdUserIds: number[] = [];
  let createdProjectId: number | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  it('levanta la aplicación y responde al endpoint raíz', async () => {
    await request(app.getHttpServer()).get('/').expect(200, 'Hello World!');
  });

  it('ejecuta el flujo real: auth → proyecto → wallet → inversión → dashboard', async () => {
    const investorRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: investorEmail, password, role: Role.INVESTOR })
      .expect(201);
    const investor = investorRegistration.body as RegistrationResponse;
    createdUserIds.push(investor.id);

    const pymeRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: pymeEmail, password, role: Role.PYME })
      .expect(201);
    const pyme = pymeRegistration.body as RegistrationResponse;
    createdUserIds.push(pyme.id);

    const investorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: investorEmail, password })
      .expect(200);
    const investorToken = (investorLogin.body as LoginResponse).access_token;

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('x-user-id', String(pyme.id))
      .set('x-user-role', Role.PYME)
      .send({
        title: `Proyecto E2E ${suffix}`,
        description: 'Proyecto creado desde una petición HTTP de integración.',
        fundingGoal: 5000,
        deadline: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        returnRate: 0.12,
      })
      .expect(201);
    createdProjectId = (project.body as ProjectResponse).id;

    await request(app.getHttpServer())
      .patch(`/projects/${createdProjectId}/status`)
      .set('x-user-id', String(pyme.id))
      .set('x-user-role', Role.PYME)
      .send({ status: 'ACTIVE' })
      .expect(200)
      .expect((response) =>
        expect((response.body as ProjectResponse).status).toBe('ACTIVE'),
      );

    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${investorToken}`)
      .send({ amount: 1000 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/investments')
      .set('Authorization', `Bearer ${investorToken}`)
      .send({ projectId: createdProjectId, amount: 500 })
      .expect(201)
      .expect((response) =>
        expect((response.body as InvestmentResponse).amount).toBe(500),
      );

    await request(app.getHttpServer())
      .get('/dashboard/investor')
      .set('Authorization', `Bearer ${investorToken}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as DashboardResponse;
        expect(body.investorId).toBe(investor.id);
        expect(body.summary.activeInvestmentsTotal).toBe(500);
        expect(body.summary.activeProjectsCount).toBe(1);
        expect(body.summary.estimatedIrrPercentage).toBeGreaterThan(0);
        expect(body.activeInvestments).toHaveLength(1);
        expect(body.activeInvestments[0]).toMatchObject({
          projectId: createdProjectId,
          amount: 500,
          offeredReturnRatePercentage: 12,
          estimatedReturn: 60,
        });
        expect(body.returnHistory).toEqual([]);
      });
  });

  it('protege el dashboard cuando no se envía JWT', async () => {
    await request(app.getHttpServer()).get('/dashboard/investor').expect(401);
  });

  afterAll(async () => {
    if (createdProjectId !== undefined) {
      await prisma.investment.deleteMany({
        where: { projectId: createdProjectId },
      });
      await prisma.project.deleteMany({ where: { id: createdProjectId } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await app.close();
  });
});
