import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombreUsuario: string;

  @ApiProperty({ example: 'Admin2026!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  contrasena: string;
}
