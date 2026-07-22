import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'diego@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 6, format: 'password' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ enum: ['INVESTOR', 'PYME', 'ADMIN'], example: 'INVESTOR' })
  @IsEnum(Role, { message: 'El rol debe ser INVESTOR, PYME o ADMIN' })
  role: Role;
}
