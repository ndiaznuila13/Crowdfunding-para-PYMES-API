import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

describe('FinanceController', () => {
  let controller: FinanceController;
  let service: FinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [
        {
          provide: FinanceService,
          useValue: {
            refundInvestors: jest.fn(),
            distributeReturns: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FinanceController>(FinanceController);
    service = module.get<FinanceService>(FinanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('refundInvestors', () => {
    it('should call refundInvestors with correct projectId', async () => {
      const mockResult = { message: 'Reembolso exitoso' };
      jest.spyOn(service, 'refundInvestors').mockResolvedValue(mockResult as any);

      const result = await controller.refundInvestors(1);
      expect(service.refundInvestors).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('distributeReturns', () => {
    it('should call distributeReturns with correct projectId', async () => {
      const mockResult = { message: 'Distribución exitosa' };
      jest.spyOn(service, 'distributeReturns').mockResolvedValue(mockResult as any);

      const result = await controller.distributeReturns(1);
      expect(service.distributeReturns).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});
