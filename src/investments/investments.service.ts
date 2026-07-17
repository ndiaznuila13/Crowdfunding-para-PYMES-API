import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, { projectId, amount }: CreateInvestmentDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`El proyecto ${projectId} no existe`);
    }
    if (project.status !== Status.ACTIVE) {
      throw new BadRequestException('El proyecto no está activo para recibir inversiones');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.balance < amount) {
      throw new BadRequestException('Saldo insuficiente para realizar la inversión');
    }

    const [investment] = await this.prisma.$transaction([
      this.prisma.investment.create({
        data: { amount, userId, projectId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.project.update({
        where: { id: projectId },
        data: { currentFunding: { increment: amount } },
      }),
    ]);

    return investment;
  }
}
