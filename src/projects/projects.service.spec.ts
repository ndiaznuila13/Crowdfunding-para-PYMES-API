import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Status, Role } from '@prisma/client';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prismaMock = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un proyecto con estado DRAFT si la fecha limite es futura', async () => {
      const dto = {
        title: 'Nuevo Proyecto',
        description: 'Descripcion del proyecto nuevo',
        fundingGoal: 1000,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // mañana
        returnRate: 10,
      };

      const mockProject = {
        id: 1,
        title: dto.title,
        description: dto.description,
        fundingGoal: dto.fundingGoal,
        deadline: new Date(dto.deadline),
        returnRate: dto.returnRate,
        status: Status.DRAFT,
        currentFunding: 0,
        ownerId: 1,
      };

      prismaMock.project.create.mockResolvedValue(mockProject);

      const result = await service.create(dto, 1);
      expect(result).toBeDefined();
      expect(result.status).toBe(Status.DRAFT);
      expect(result.ownerId).toBe(1);
    });

    it('debe lanzar BadRequestException si la fecha limite es pasada o actual', async () => {
      const dto = {
        title: 'Proyecto Pasado',
        description: 'Descripcion del proyecto nuevo',
        fundingGoal: 1000,
        deadline: new Date(Date.now() - 1000 * 60).toISOString(), // hace 1 minuto
        returnRate: 10,
      };

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('transitionStatus', () => {
    const mockUser = { id: 1, role: Role.PYME };
    const mockProject = {
      id: 1,
      title: 'Proyecto Test',
      description: 'Descripcion...',
      fundingGoal: 1000,
      currentFunding: 0,
      deadline: new Date(),
      returnRate: 10,
      status: Status.DRAFT,
      ownerId: 1,
    };

    it('debe permitir transicionar de DRAFT a ACTIVE si el usuario es el dueño', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      prismaMock.project.update.mockResolvedValue({
        ...mockProject,
        status: Status.ACTIVE,
      });

      const result = await service.transitionStatus(1, Status.ACTIVE, mockUser);
      expect(result.status).toBe(Status.ACTIVE);
    });

    it('debe lanzar ForbiddenException si el usuario no es el dueño ni admin', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject);
      const foreignUser = { id: 2, role: Role.PYME };

      await expect(
        service.transitionStatus(1, Status.ACTIVE, foreignUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si la transicion no es valida según la maquina de estados', async () => {
      prismaMock.project.findUnique.mockResolvedValue(mockProject); // status: DRAFT

      // Transicion no permitida: DRAFT -> COMPLETED
      await expect(
        service.transitionStatus(1, Status.COMPLETED, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
