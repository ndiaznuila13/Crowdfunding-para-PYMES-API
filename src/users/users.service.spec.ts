import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Role } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: '123', role: Role.INVESTOR, balance: 0 };
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      
      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.findById(1)).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: '123', role: Role.INVESTOR, balance: 0 };
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: '123', role: Role.INVESTOR, balance: 1000 };
      prismaMock.user.create.mockResolvedValue(mockUser as any);

      const result = await service.create({
        email: 'test@test.com',
        password: '123',
        role: Role.INVESTOR,
        balance: 1000
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@test.com',
          password: '123',
          role: Role.INVESTOR,
          balance: 1000,
        }
      });
      expect(result).toEqual(mockUser);
    });
  });
});
