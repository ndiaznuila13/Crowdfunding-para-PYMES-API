import { IsNumber, IsPositive, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    example: 500,
    minimum: 0.01,
    maximum: 1000000,
    description: 'Monto que se agregará al saldo del inversionista',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Max(1000000, { message: 'Monto excede el máximo permitido' })
  amount: number;
}
