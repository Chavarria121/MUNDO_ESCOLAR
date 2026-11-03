import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarContrasenaDto {
  @ApiProperty({ example: 'Admin2026!', description: 'Contraseña actual del usuario' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria.' })
  contrasenaActual: string;

  @ApiProperty({ example: 'AdminNueva2026*!', minLength: 8, description: 'Nueva contraseña segura (mínimo 8 caracteres)' })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @MinLength(8, { message: 'La nueva contraseña debe contener al menos 8 caracteres.' })
  contrasenaNueva: string;
}
