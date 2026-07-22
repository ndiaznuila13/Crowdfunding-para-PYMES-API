import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_INVESTMENT_STATUSES: Status[] = [
  Status.ACTIVE,
  Status.FUNDED,
  Status.IN_PROGRESS,
];

type CashFlow = { date: Date; amount: number };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvestorDashboard(userId: number) {
    const investments = await this.prisma.investment.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            returnRate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeInvestments = investments.filter((investment) =>
      ACTIVE_INVESTMENT_STATUSES.includes(investment.project.status),
    );
    const completedInvestments = investments.filter(
      (investment) => investment.project.status === Status.COMPLETED,
    );

    const activeInvestmentsTotal = activeInvestments.reduce(
      (total, investment) => total + investment.amount,
      0,
    );
    const returnsReceivedTotal = completedInvestments.reduce(
      (total, investment) =>
        total + investment.amount * investment.project.returnRate,
      0,
    );

    const estimatedIrr = this.calculateEstimatedIrr(
      activeInvestments.flatMap((investment): CashFlow[] => [
        { date: investment.createdAt, amount: -investment.amount },
        {
          date: investment.project.deadline,
          amount: investment.amount * (1 + investment.project.returnRate),
        },
      ]),
    );

    return {
      investorId: userId,
      generatedAt: new Date().toISOString(),
      summary: {
        activeInvestmentsTotal: this.roundMoney(activeInvestmentsTotal),
        returnsReceivedTotal: this.roundMoney(returnsReceivedTotal),
        estimatedIrrPercentage:
          estimatedIrr === null ? null : this.round(estimatedIrr * 100, 4),
        activeProjectsCount: new Set(
          activeInvestments.map((investment) => investment.projectId),
        ).size,
      },
      activeInvestments: activeInvestments.map((investment) => ({
        investmentId: investment.id,
        projectId: investment.project.id,
        projectTitle: investment.project.title,
        projectStatus: investment.project.status,
        amount: this.roundMoney(investment.amount),
        investedAt: investment.createdAt,
        deadline: investment.project.deadline,
        offeredReturnRatePercentage: this.round(
          investment.project.returnRate * 100,
          4,
        ),
        estimatedReturn: this.roundMoney(
          investment.amount * investment.project.returnRate,
        ),
      })),
      returnHistory: completedInvestments.map((investment) => {
        const returnAmount = investment.amount * investment.project.returnRate;
        return {
          investmentId: investment.id,
          projectId: investment.project.id,
          projectTitle: investment.project.title,
          principal: this.roundMoney(investment.amount),
          returnAmount: this.roundMoney(returnAmount),
          totalReceived: this.roundMoney(investment.amount + returnAmount),
          completedAt: investment.project.deadline,
        };
      }),
    };
  }

  private calculateEstimatedIrr(cashFlows: CashFlow[]): number | null {
    if (
      cashFlows.length < 2 ||
      !cashFlows.some(({ amount }) => amount < 0) ||
      !cashFlows.some(({ amount }) => amount > 0)
    ) {
      return null;
    }

    const firstDate = cashFlows.reduce(
      (earliest, flow) =>
        flow.date.getTime() < earliest.getTime() ? flow.date : earliest,
      cashFlows[0].date,
    );
    const millisecondsPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const npv = (rate: number) =>
      cashFlows.reduce((total, flow) => {
        const years = Math.max(
          (flow.date.getTime() - firstDate.getTime()) / millisecondsPerYear,
          1 / 365.25,
        );
        return total + flow.amount / Math.pow(1 + rate, years);
      }, 0);

    let low = -0.9999;
    let high = 10;
    let lowValue = npv(low);
    const highValue = npv(high);
    if (!Number.isFinite(lowValue) || lowValue * highValue > 0) return null;

    for (let iteration = 0; iteration < 200; iteration += 1) {
      const middle = (low + high) / 2;
      const middleValue = npv(middle);
      if (Math.abs(middleValue) < 0.000001) return middle;

      if (lowValue * middleValue <= 0) {
        high = middle;
      } else {
        low = middle;
        lowValue = middleValue;
      }
    }

    return (low + high) / 2;
  }

  private roundMoney(value: number): number {
    return this.round(value, 2);
  }

  private round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
