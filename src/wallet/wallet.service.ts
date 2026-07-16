import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async deposit(userId: number, userRole: Role, amount: number) {
    if (userRole !== Role.INVESTOR) {
      throw new ForbiddenException('Solo los inversionistas pueden depositar');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
      select: { id: true, email: true, balance: true },
    });

    return {
      message: 'Depósito exitoso',
      ...updated,
    };
  }

  async getBalance(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, balance: true },
    });
  }
}
