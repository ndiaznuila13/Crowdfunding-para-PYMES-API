import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FinanceService } from './finance.service';

@Module({
  imports: [PrismaModule],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
