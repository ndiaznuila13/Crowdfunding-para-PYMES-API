import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const dto = { email: 'test@test.com', password: '123', role: Role.INVESTOR };
      const mockResult = { id: 1, email: 'test@test.com', role: Role.INVESTOR, balance: 1000 };
      jest.spyOn(service, 'register').mockResolvedValue(mockResult as any);

      const result = await controller.register(dto);
      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const dto = { email: 'test@test.com', password: '123' };
      const mockResult = { access_token: 'token', user: { id: 1, email: 'test@test.com', role: Role.INVESTOR } };
      jest.spyOn(service, 'login').mockResolvedValue(mockResult as any);

      const result = await controller.login(dto);
      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });
});
