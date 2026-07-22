import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getInvestorDashboard: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInvestorDashboard', () => {
    it('should call getInvestorDashboard with correct user id', async () => {
      const mockResult = { totalInvested: 100, activeProjects: 1, expectedReturns: 10 };
      jest.spyOn(service, 'getInvestorDashboard').mockResolvedValue(mockResult as any);

      const result = await controller.getInvestorDashboard({ id: 1 });
      expect(service.getInvestorDashboard).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });
});
