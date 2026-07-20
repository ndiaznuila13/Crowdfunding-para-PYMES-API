import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('investor')
  @Roles(Role.INVESTOR)
  @ApiOperation({
    summary: 'Consolidar métricas del dashboard del inversionista autenticado',
  })
  @ApiResponse({ status: 200, description: 'Dashboard consolidado.' })
  @ApiResponse({ status: 401, description: 'JWT ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'El usuario no es inversionista.' })
  getInvestorDashboard(@CurrentUser() user: { id: number }) {
    return this.dashboardService.getInvestorDashboard(user.id);
  }
}
