import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Role, Status } from '@prisma/client';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let serviceMock: DeepMockProxy<ProjectsService>;

  beforeEach(async () => {
    serviceMock = mockDeep<ProjectsService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe delegar la creacion al servicio', async () => {
      const dto = {
        title: 'Nuevo Proyecto',
        description: 'Descripcion del proyecto nuevo',
        fundingGoal: 1000,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        returnRate: 10,
      };
      const user = { id: 1, role: Role.PYME };

      serviceMock.create.mockResolvedValue({
        id: 1,
        title: dto.title,
        description: dto.description,
        fundingGoal: dto.fundingGoal,
        deadline: new Date(dto.deadline),
        returnRate: dto.returnRate,
        status: Status.DRAFT,
        currentFunding: 0,
        ownerId: 1,
      });

      const result = await controller.create(dto, user);
      expect(result).toBeDefined();
      expect(serviceMock.create).toHaveBeenCalledWith(dto, user.id);
    });
  });

  describe('transitionStatus', () => {
    it('debe llamar al metodo transitionStatus del servicio', async () => {
      const user = { id: 1, role: Role.PYME };
      serviceMock.transitionStatus.mockResolvedValue({
        id: 1,
        title: 'Proyecto',
        description: '...',
        fundingGoal: 1000,
        currentFunding: 0,
        deadline: new Date(),
        returnRate: 10,
        status: Status.ACTIVE,
        ownerId: 1,
      });

      const result = await controller.transitionStatus('1', Status.ACTIVE, user);
      expect(result.status).toBe(Status.ACTIVE);
      expect(serviceMock.transitionStatus).toHaveBeenCalledWith(1, Status.ACTIVE, user);
    });
  });
});
