import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async refundInvestors(projectId: number): Promise<void> {
    const investments = await this.prisma.investment.findMany({
      where: { projectId },
    });

    if (investments.length === 0) return;

    await this.prisma.$transaction(
      investments.map((inv) =>
        this.prisma.user.update({
          where: { id: inv.userId },
          data: { balance: { increment: inv.amount } },
        }),
      ),
    );
  }

  async distributeReturns(projectId: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto ${projectId} no encontrado`);
    }

    if (project.status !== Status.COMPLETED) {
      throw new BadRequestException(
        `Solo se pueden distribuir retornos de proyectos en estado COMPLETED. Estado actual: ${project.status}`,
      );
    }

    const investments = await this.prisma.investment.findMany({
      where: { projectId },
    });

    if (investments.length === 0) return;

    await this.prisma.$transaction(
      investments.map((inv) => {
        const returnAmount = +(
          inv.amount +
          inv.amount * project.returnRate
        ).toFixed(2);

        return this.prisma.user.update({
          where: { id: inv.userId },
          data: { balance: { increment: returnAmount } },
        });
      }),
    );
  }
}
