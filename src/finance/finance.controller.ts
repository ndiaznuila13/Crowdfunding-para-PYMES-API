import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post(':projectId/refund')
  @ApiOperation({
    summary: 'Reembolsar capital a inversores de un proyecto cancelado',
  })
  @ApiParam({ name: 'projectId', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Reembolso ejecutado.' })
  @ApiResponse({ status: 401, description: 'JWT ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Se requiere rol ADMIN.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  refundInvestors(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.financeService.refundInvestors(projectId);
  }

  @Post(':projectId/distribute')
  @ApiOperation({
    summary: 'Distribuir retornos a inversores de un proyecto completado',
  })
  @ApiParam({ name: 'projectId', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Distribución ejecutada.' })
  @ApiResponse({ status: 401, description: 'JWT ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Se requiere rol ADMIN.' })
  @ApiResponse({ status: 404, description: 'Proyecto no encontrado.' })
  @ApiResponse({
    status: 400,
    description: 'El proyecto no está en estado COMPLETED.',
  })
  distributeReturns(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.financeService.distributeReturns(projectId);
  }
}
