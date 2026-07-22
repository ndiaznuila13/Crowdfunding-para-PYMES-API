import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Role } from '@prisma/client';

describe('WalletController', () => {
  let controller: WalletController;
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            deposit: jest.fn(),
            getBalance: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('deposit', () => {
    it('should call walletService.deposit with correct parameters', async () => {
      const mockUser = { id: 1, role: Role.INVESTOR };
      const dto = { amount: 100 };
      const mockResult = { message: 'Depósito exitoso', id: 1, email: 'test@test.com', balance: 1100 };
      
      jest.spyOn(service, 'deposit').mockResolvedValue(mockResult as any);

      const result = await controller.deposit(mockUser, dto);

      expect(service.deposit).toHaveBeenCalledWith(1, Role.INVESTOR, 100);
      expect(result).toEqual(mockResult);
    });
  });

  describe('balance', () => {
    it('should call walletService.getBalance with correct user id', async () => {
      const mockUser = { id: 1 };
      const mockResult = { id: 1, email: 'test@test.com', balance: 500 };
      
      jest.spyOn(service, 'getBalance').mockResolvedValue(mockResult as any);

      const result = await controller.balance(mockUser as any);

      expect(service.getBalance).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});
