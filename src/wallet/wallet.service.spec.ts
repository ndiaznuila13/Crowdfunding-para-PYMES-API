import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('WalletService', () => {
  let service: WalletService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deposit', () => {
    it('should throw ForbiddenException if user is not INVESTOR', async () => {
      await expect(service.deposit(1, Role.PYME, 100)).rejects.toThrow(ForbiddenException);
    });

    it('should increment balance if user is INVESTOR', async () => {
      const mockUpdated = { id: 1, email: 'test@test.com', balance: 1100 };
      prismaMock.user.update.mockResolvedValue(mockUpdated as any);

      const result = await service.deposit(1, Role.INVESTOR, 100);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { balance: { increment: 100 } },
        select: { id: true, email: true, balance: true },
      });
      expect(result).toEqual({ message: 'Depósito exitoso', ...mockUpdated });
    });
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      const mockUser = { id: 1, email: 'test@test.com', balance: 500 };
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getBalance(1);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, email: true, balance: true },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
