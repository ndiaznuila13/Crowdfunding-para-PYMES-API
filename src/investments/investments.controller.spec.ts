import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { Role } from '@prisma/client';

describe('InvestmentsController', () => {
  let controller: InvestmentsController;
  let service: InvestmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentsController],
      providers: [
        {
          provide: InvestmentsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InvestmentsController>(InvestmentsController);
    service = module.get<InvestmentsService>(InvestmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call investmentsService.create with correct parameters', async () => {
      const mockRequest = { user: { id: 1, role: Role.INVESTOR } } as any;
      const dto = { projectId: 1, amount: 100 };
      
      const mockResult = { id: 1, amount: 100, createdAt: new Date(), userId: 1, projectId: 1 };
      jest.spyOn(service, 'create').mockResolvedValue(mockResult as any);

      const result = await controller.create(mockRequest, dto);

      expect(service.create).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
    });
  });
});
