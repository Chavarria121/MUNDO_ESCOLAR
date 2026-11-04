import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SolicitarRecuperacionDto {
  @ApiProperty({
    example: '1-1555-0899',
    description: 'Cédula, correo electrónico o nombre de usuario del titular',
  })
  @IsString()
  @IsNotEmpty({ message: 'El identificador, cédula o correo es obligatorio.' })
  identificador: string;
}

export class ConfirmarRecuperacionDto {
  @ApiProperty({
    example: '1-1555-0899',
    description: 'Cédula, correo electrónico o nombre de usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El identificador es obligatorio.' })
  identificador: string;

  @ApiProperty({
    example: '492018',
    description: 'Código de verificación de 6 dígitos recibido por correo',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código OTP es obligatorio.' })
  @MinLength(6, { message: 'El código OTP debe ser de 6 dígitos.' })
  @MaxLength(6)
  codigoOtp: string;

  @ApiProperty({
    example: 'NuevaClaveSegura2026!',
    description: 'Nueva contraseña que sustituirá a la anterior',
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria.' })
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
  contrasenaNueva: string;
}

