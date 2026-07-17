import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { InvestmentsService } from './investments.service';

interface AuthenticatedRequest extends Request {
  user: { id: number; role: Role };
}

@ApiTags('investments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Roles(Role.INVESTOR)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() createInvestmentDto: CreateInvestmentDto) {
    return this.investmentsService.create(req.user.id, createInvestmentDto);
  }
}
