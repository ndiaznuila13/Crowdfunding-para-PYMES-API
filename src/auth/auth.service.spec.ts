import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 1 } as any);
      await expect(service.register({ email: 'test@test.com', password: '123', role: Role.INVESTOR })).rejects.toThrow(ConflictException);
    });

    it('should create user and return mapped data', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      configService.get.mockReturnValue('1500');
      
      const mockCreatedUser = { id: 1, email: 'test@test.com', password: 'hashed_pw', role: Role.INVESTOR, balance: 1500 };
      usersService.create.mockResolvedValue(mockCreatedUser as any);

      const result = await service.register({ email: 'test@test.com', password: '123', role: Role.INVESTOR });

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'hashed_pw',
        role: Role.INVESTOR,
        balance: 1500,
      });
      expect(result).toEqual({ id: 1, email: 'test@test.com', role: Role.INVESTOR, balance: 1500 });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 1, password: 'hashed_pw' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      await expect(service.login({ email: 'test@test.com', password: '123' })).rejects.toThrow(UnauthorizedException);
    });

    it('should return access_token and user info if valid', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: 'hashed_pw', role: Role.INVESTOR };
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('token123');
      
      const result = await service.login({ email: 'test@test.com', password: '123' });
      expect(result).toEqual({
        access_token: 'token123',
        user: { id: 1, email: 'test@test.com', role: Role.INVESTOR }
      });
    });
  });
});
