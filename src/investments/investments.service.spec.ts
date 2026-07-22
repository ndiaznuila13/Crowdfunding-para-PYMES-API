import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsService } from './investments.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Status, Role } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockUser = { id: 1, email: 'inv@test.com', password: '123', role: Role.INVESTOR, balance: 1000 };
    const mockProject = {
      id: 1,
      title: 'Project 1',
      description: 'Desc',
      fundingGoal: 1000,
      currentFunding: 0,
      deadline: new Date(),
      returnRate: 10,
      status: Status.ACTIVE,
      ownerId: 2,
    };

    it('should throw NotFoundException if project not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);
      await expect(service.create(1, { projectId: 1, amount: 100 })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if project is not ACTIVE', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ ...mockProject, status: Status.FUNDED });
      await expect(service.create(1, { projectId: 1, amount: 100 })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.create(1, { projectId: 1, amount: 100 })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user balance is insufficient', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, balance: 50 });
      await expect(service.create(1, { projectId: 1, amount: 100 })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount exceeds remaining funding', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ ...mockProject, fundingGoal: 1000, currentFunding: 950 });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      await expect(service.create(1, { projectId: 1, amount: 100 })).rejects.toThrow(BadRequestException);
    });

    it('should create investment and change status to FUNDED if goal reached', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject); 
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const mockInvestment = { id: 1, amount: 1000, createdAt: new Date(), userId: 1, projectId: 1 };
      
      prismaMock.$transaction.mockResolvedValue([mockInvestment, {}, {}]);

      const result = await service.create(1, { projectId: 1, amount: 1000 });
      expect(result).toEqual(mockInvestment);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should create investment without changing status if goal not reached', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject); 
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const mockInvestment = { id: 1, amount: 100, createdAt: new Date(), userId: 1, projectId: 1 };
      
      prismaMock.$transaction.mockResolvedValue([mockInvestment, {}, {}]);

      const result = await service.create(1, { projectId: 1, amount: 100 });
      expect(result).toEqual(mockInvestment);
    });
  });
});
