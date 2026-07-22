import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';

export class Project {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Expansión de Panadería Central' })
  title: string;

  @ApiProperty({
    example: 'Compra de equipo productivo para ampliar la capacidad.',
  })
  description: string;

  @ApiProperty({ example: 10000 })
  fundingGoal: number;

  @ApiProperty({ example: 2500 })
  currentFunding: number;

  @ApiProperty({ example: '2026-12-31T23:59:59.999Z' })
  deadline: Date;

  @ApiProperty({
    example: 0.12,
    description: 'Tasa de retorno anual en formato decimal',
  })
  returnRate: number;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  status: Status;

  @ApiProperty({ example: 1 })
  ownerId: number;

  @ApiPropertyOptional({
    description: 'Se incluye al consultar proyectos.',
    example: {
      id: 1,
      email: 'pyme@example.com',
      role: Role.PYME,
      balance: 0,
    },
  })
  owner?: {
    id: number;
    email: string;
    role: Role;
    balance: number;
  };
}
