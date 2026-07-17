import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class CreateInvestmentDto {
  @ApiProperty({ description: 'ID del proyecto en el que se desea invertir' })
  @IsInt()
  @IsPositive()
  projectId: number;

  @ApiProperty({ description: 'Monto a invertir' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
