import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateInvestmentDto {
  @ApiProperty({
    example: 1,
    minimum: 1,
    description: 'ID del proyecto ACTIVE en el que se desea invertir',
  })
  @IsInt()
  @IsPositive()
  projectId: number;

  @ApiProperty({ example: 250, minimum: 0.01, description: 'Monto a invertir' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
