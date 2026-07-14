import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Status, Role } from '@prisma/client';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, ownerId: number) {
    const deadlineDate = new Date(createProjectDto.deadline);
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('El plazo límite (deadline) debe ser una fecha futura.');
    }

    return this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        description: createProjectDto.description,
        fundingGoal: createProjectDto.fundingGoal,
        deadline: deadlineDate,
        returnRate: createProjectDto.returnRate,
        status: Status.DRAFT,
        ownerId: ownerId,
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
            balance: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
            balance: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id} no fue encontrado.`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, currentUser: any) {
    const project = await this.findOne(id);

    // Verificar propiedad o rol ADMIN
    if (currentUser.role !== Role.ADMIN && project.ownerId !== currentUser.id) {
      throw new ForbiddenException('No tienes permisos para modificar este proyecto.');
    }

    const dataToUpdate: any = { ...updateProjectDto };

    if (updateProjectDto.deadline) {
      const deadlineDate = new Date(updateProjectDto.deadline);
      if (deadlineDate <= new Date()) {
        throw new BadRequestException('El plazo límite (deadline) debe ser una fecha futura.');
      }
      dataToUpdate.deadline = deadlineDate;
    }

    return this.prisma.project.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: number, currentUser: any) {
    const project = await this.findOne(id);

    // Verificar propiedad o rol ADMIN
    if (currentUser.role !== Role.ADMIN && project.ownerId !== currentUser.id) {
      throw new ForbiddenException('No tienes permisos para eliminar este proyecto.');
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  // --- Máquina de Estados ---
  async transitionStatus(id: number, newStatus: Status, currentUser: any) {
    const project = await this.findOne(id);

    // Verificar propiedad o rol ADMIN
    if (currentUser.role !== Role.ADMIN && project.ownerId !== currentUser.id) {
      throw new ForbiddenException('No tienes permisos para cambiar el estado de este proyecto.');
    }

    const isValid = this.validateStatusTransition(project.status, newStatus);
    if (!isValid) {
      throw new BadRequestException(
        `Transición de estado no permitida: de ${project.status} a ${newStatus}.`
      );
    }

    return this.prisma.project.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  private validateStatusTransition(current: Status, target: Status): boolean {
    const allowedTransitions: Record<Status, Status[]> = {
      [Status.DRAFT]: [Status.ACTIVE, Status.CANCELED],
      [Status.ACTIVE]: [Status.FUNDED, Status.CANCELED],
      [Status.FUNDED]: [Status.IN_PROGRESS, Status.CANCELED],
      [Status.IN_PROGRESS]: [Status.COMPLETED, Status.DEFAULT],
      [Status.COMPLETED]: [],
      [Status.DEFAULT]: [],
      [Status.CANCELED]: [],
    };

    const allowed = allowedTransitions[current] || [];
    return allowed.includes(target);
  }

  // --- Tarea Cron (Cierre Automático de Proyectos Expirados) ---
  @Cron('*/10 * * * * *') // Se ejecuta cada 10 segundos en desarrollo
  async handleExpiredProjects() {
    this.logger.debug('Ejecutando Cron Job: Verificación de proyectos ACTIVE expirados...');
    const now = new Date();

    const expiredProjects = await this.prisma.project.findMany({
      where: {
        status: Status.ACTIVE,
        deadline: {
          lt: now,
        },
      },
    });

    if (expiredProjects.length === 0) {
      return;
    }

    this.logger.log(`Se encontraron ${expiredProjects.length} proyectos activos expirados.`);

    for (const project of expiredProjects) {
      const reachedGoal = project.currentFunding >= project.fundingGoal;
      const targetStatus = reachedGoal ? Status.FUNDED : Status.CANCELED;

      await this.prisma.project.update({
        where: { id: project.id },
        data: { status: targetStatus },
      });

      this.logger.log(
        `Proyecto ID ${project.id} ("${project.title}") expiró. Fondeo actual: ${project.currentFunding}/${project.fundingGoal}. Estado cambiado de ACTIVE a ${targetStatus}.`
      );
    }
  }
}
