import { Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('consolida inversiones vigentes, retornos completados y TIR estimada', async () => {
    const prisma = {
      investment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            userId: 7,
            projectId: 10,
            amount: 1000,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            project: {
              id: 10,
              title: 'Proyecto activo',
              status: Status.ACTIVE,
              deadline: new Date('2027-01-01T00:00:00.000Z'),
              returnRate: 0.12,
            },
          },
          {
            id: 2,
            userId: 7,
            projectId: 11,
            amount: 500,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            project: {
              id: 11,
              title: 'Proyecto completado',
              status: Status.COMPLETED,
              deadline: new Date('2026-01-01T00:00:00.000Z'),
              returnRate: 0.1,
            },
          },
          {
            id: 3,
            userId: 7,
            projectId: 12,
            amount: 300,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            project: {
              id: 12,
              title: 'Proyecto cancelado',
              status: Status.CANCELED,
              deadline: new Date('2026-01-01T00:00:00.000Z'),
              returnRate: 0.2,
            },
          },
        ]),
      },
    };
    const service = new DashboardService(prisma as unknown as PrismaService);

    const dashboard = await service.getInvestorDashboard(7);

    expect(prisma.investment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7 } }),
    );
    expect(dashboard.summary).toMatchObject({
      activeInvestmentsTotal: 1000,
      returnsReceivedTotal: 50,
      activeProjectsCount: 1,
    });
    expect(dashboard.summary.estimatedIrrPercentage).toBeGreaterThan(0);
    expect(dashboard.activeInvestments).toHaveLength(1);
    expect(dashboard.activeInvestments[0].estimatedReturn).toBe(120);
    expect(dashboard.returnHistory).toEqual([
      expect.objectContaining({
        investmentId: 2,
        principal: 500,
        returnAmount: 50,
        totalReceived: 550,
      }),
    ]);
  });

  it('devuelve TIR nula cuando no hay inversiones vigentes', async () => {
    const prisma = {
      investment: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new DashboardService(prisma as unknown as PrismaService);

    const dashboard = await service.getInvestorDashboard(99);

    expect(dashboard.summary.estimatedIrrPercentage).toBeNull();
    expect(dashboard.summary.activeInvestmentsTotal).toBe(0);
    expect(dashboard.returnHistory).toEqual([]);
  });
});
