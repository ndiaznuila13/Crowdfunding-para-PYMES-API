import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Invertir en un proyecto activo (solo INVESTOR)',
    description:
      'Descuenta el monto del saldo del inversionista y lo agrega al fondeo del proyecto.',
  })
  @ApiResponse({
    status: 201,
    description: 'Inversión registrada correctamente.',
    schema: {
      example: {
        id: 1,
        amount: 250,
        createdAt: '2026-07-22T18:00:00.000Z',
        userId: 3,
        projectId: 1,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Proyecto inactivo, saldo insuficiente o datos inválidos.',
  })
  @ApiResponse({ status: 401, description: 'JWT ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Se requiere rol INVESTOR.' })
  @ApiResponse({
    status: 404,
    description: 'Proyecto o usuario no encontrado.',
  })
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createInvestmentDto: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(req.user.id, createInvestmentDto);
  }
}
