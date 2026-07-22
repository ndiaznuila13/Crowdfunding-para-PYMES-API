import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  @Roles(Role.INVESTOR)
  @ApiOperation({ summary: 'Depositar fondos (solo INVESTOR)' })
  @ApiResponse({
    status: 201,
    description: 'Depósito aplicado correctamente.',
    schema: {
      example: {
        message: 'Depósito exitoso',
        id: 3,
        email: 'investor@example.com',
        balance: 1500,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Monto inválido.' })
  @ApiResponse({ status: 401, description: 'JWT ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Se requiere rol INVESTOR.' })
  deposit(
    @CurrentUser() user: { id: number; role: Role },
    @Body() dto: DepositDto,
  ) {
    return this.walletService.deposit(user.id, user.role, dto.amount);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Consultar balance del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Balance actual del usuario.',
    schema: {
      example: {
        id: 3,
        email: 'investor@example.com',
        balance: 1000,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'JWT ausente o inválido.' })
  balance(@CurrentUser() user: { id: number }) {
    return this.walletService.getBalance(user.id);
  }
}
