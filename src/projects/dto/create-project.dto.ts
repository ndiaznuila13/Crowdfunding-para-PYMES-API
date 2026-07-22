import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsNumber,
  IsPositive,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Expansión de Panadería Central',
    description: 'Título del proyecto',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example:
      'Financiamiento para adquirir hornos industriales y aumentar la capacidad productiva.',
    description: 'Descripción detallada',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 150000.0, description: 'Meta de fondeo en dólares' })
  @IsNumber()
  @IsPositive()
  fundingGoal: number;

  @ApiProperty({
    example: '2026-12-31T23:59:59.999Z',
    description: 'Plazo límite para fondear el proyecto',
  })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @ApiProperty({
    example: 0.125,
    description:
      'Tasa de retorno anual en formato decimal (0.125 equivale a 12.5%)',
  })
  @IsNumber()
  @IsPositive()
  returnRate: number;
}
