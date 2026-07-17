import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from './finance.service';

function makeInvestment(
  overrides: Partial<{
    id: number;
    userId: number;
    projectId: number;
    amount: number;
  }> = {},
) {
  return {
    id: 1,
    userId: 10,
    projectId: 1,
    amount: 500.0,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeProject(
  overrides: Partial<{
    id: number;
    status: Status;
    returnRate: number;
    fundingGoal: number;
    currentFunding: number;
  }> = {},
) {
  return {
    id: 1,
    title: 'Proyecto Test',
    description: 'descripción',
    fundingGoal: 1000.0,
    currentFunding: 1000.0,
    deadline: new Date('2025-12-31'),
    returnRate: 0.15,
    status: Status.COMPLETED,
    ownerId: 99,
    ...overrides,
  };
}

const mockPrisma = {
  investment: { findMany: jest.fn() },
  project: { findUnique: jest.fn() },
  user: { update: jest.fn() },
  $transaction: jest.fn(),
};

describe('FinanceService', () => {
  let service: FinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    jest.clearAllMocks();
  });

  describe('refundInvestors', () => {
    it('no ejecuta transacción cuando no hay inversiones', async () => {
      mockPrisma.investment.findMany.mockResolvedValue([]);

      await service.refundInvestors(1);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('devuelve el monto exacto al único inversor', async () => {
      const inv = makeInvestment({ userId: 10, amount: 500.0 });
      mockPrisma.investment.findMany.mockResolvedValue([inv]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.refundInvestors(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 500.0 } },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('devuelve montos independientes a cada inversor sin mezclarlos', async () => {
      const investments = [
        makeInvestment({ id: 1, userId: 10, amount: 300.0 }),
        makeInvestment({ id: 2, userId: 20, amount: 700.0 }),
      ];
      mockPrisma.investment.findMany.mockResolvedValue(investments);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.refundInvestors(1);

      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 300.0 } },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { balance: { increment: 700.0 } },
      });
    });

    it('maneja correctamente montos con decimales (100.50)', async () => {
      const inv = makeInvestment({ userId: 10, amount: 100.5 });
      mockPrisma.investment.findMany.mockResolvedValue([inv]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.refundInvestors(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 100.5 } },
      });
    });

    it('agrupa todas las actualizaciones en una sola transacción', async () => {
      const investments = [
        makeInvestment({ id: 1, userId: 10, amount: 200.0 }),
        makeInvestment({ id: 2, userId: 20, amount: 300.0 }),
        makeInvestment({ id: 3, userId: 30, amount: 500.0 }),
      ];
      mockPrisma.investment.findMany.mockResolvedValue(investments);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      await service.refundInvestors(1);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3);
    });

    it('usa el projectId correcto para filtrar inversiones', async () => {
      mockPrisma.investment.findMany.mockResolvedValue([]);

      await service.refundInvestors(42);

      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith({
        where: { projectId: 42 },
      });
    });
  });

  describe('distributeReturns', () => {
    it('lanza NotFoundException cuando el proyecto no existe', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.distributeReturns(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el proyecto está ACTIVE', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ status: Status.ACTIVE }),
      );

      await expect(service.distributeReturns(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException si el proyecto está FUNDED (no es COMPLETED)', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ status: Status.FUNDED }),
      );

      await expect(service.distributeReturns(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException si el proyecto está IN_PROGRESS', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ status: Status.IN_PROGRESS }),
      );

      await expect(service.distributeReturns(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza BadRequestException si el proyecto está DEFAULT (en mora)', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ status: Status.DEFAULT }),
      );

      await expect(service.distributeReturns(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('no ejecuta transacción cuando el proyecto COMPLETED no tiene inversiones', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(makeProject());
      mockPrisma.investment.findMany.mockResolvedValue([]);

      await service.distributeReturns(1);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('calcula correctamente retorno del 15% para un único inversor', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ returnRate: 0.15 }),
      );
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ userId: 10, amount: 1000.0 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.distributeReturns(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 1150.0 } },
      });
    });

    it('calcula retornos independientes para múltiples inversores', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ returnRate: 0.15 }),
      );
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ id: 1, userId: 10, amount: 300.0 }),
        makeInvestment({ id: 2, userId: 20, amount: 700.0 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await service.distributeReturns(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 345.0 } },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { balance: { increment: 805.0 } },
      });
    });

    it('redondea a 2 decimales evitando error de punto flotante', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ returnRate: 0.15 }),
      );
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ userId: 10, amount: 100.5 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.distributeReturns(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 115.58 } },
      });
    });

    it('calcula correctamente con tasa del 10% y montos enteros', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ returnRate: 0.1 }),
      );
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ userId: 10, amount: 200.0 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.distributeReturns(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 220.0 } },
      });
    });

    it('maneja tasa de retorno de 0% correctamente (devuelve solo el capital)', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ returnRate: 0.0 }),
      );
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ userId: 10, amount: 500.0 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.distributeReturns(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 500.0 } },
      });
    });

    it('maneja monto con decimales complejos sin pérdida de precisión', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProject({ returnRate: 0.1 }),
      );
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ userId: 10, amount: 33.33 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}]);

      await service.distributeReturns(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { balance: { increment: 36.66 } },
      });
    });

    it('agrupa todas las actualizaciones en una sola transacción', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(makeProject());
      mockPrisma.investment.findMany.mockResolvedValue([
        makeInvestment({ id: 1, userId: 10, amount: 100.0 }),
        makeInvestment({ id: 2, userId: 20, amount: 200.0 }),
        makeInvestment({ id: 3, userId: 30, amount: 300.0 }),
      ]);
      mockPrisma.user.update.mockReturnValue({});
      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}]);

      await service.distributeReturns(1);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3);
    });

    it('usa el projectId correcto para buscar el proyecto y sus inversiones', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(makeProject({ id: 7 }));
      mockPrisma.investment.findMany.mockResolvedValue([]);

      await service.distributeReturns(7);

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(mockPrisma.investment.findMany).toHaveBeenCalledWith({
        where: { projectId: 7 },
      });
    });
  });
});
