import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CrearClienteParticularDto {
  @ApiProperty({ example: '1-1555-0899', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  identificacion: string;

  @ApiProperty({ example: 'Alejandro', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @ApiProperty({ example: 'Navarro', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  apellido1: string;

  @ApiPropertyOptional({ example: 'Castro', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apellido2?: string;

  @ApiPropertyOptional({ example: '8877-6655', maxLength: 30 })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Heredia, San Rafael, 100m este del parque', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional({ description: 'ID de usuario opcional para el cliente (1:1 con Usuario)', example: 1 })
  @IsInt()
  @IsOptional()
  idUsuario?: number;
}

export class CrearClienteInstitucionalDto {
  @ApiProperty({ example: '3-008-777222', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  cedulaJuridica: string;

  @ApiProperty({ example: 'Liceo de Heredia', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  razonSocial: string;

  @ApiPropertyOptional({ example: 'Prof. Mario Chaves (Director)', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreContacto?: string;

  @ApiPropertyOptional({ example: '2260-1122', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefonoContacto?: string;

  @ApiPropertyOptional({ example: 'direccion@liceodeheredia.ed.cr', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  correoContacto?: string;

  @ApiPropertyOptional({ example: '2260-1100', maxLength: 30 })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Heredia centro, avenida central', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional({ description: 'ID de usuario opcional para el cliente institucional', example: 1 })
  @IsInt()
  @IsOptional()
  idUsuario?: number;
}

export class ActualizarClienteDto {
  @ApiPropertyOptional({ example: '8877-9900', maxLength: 30 })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Nueva dirección actualizada', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  // Campos para particular
  @ApiPropertyOptional({ example: 'Alejandro', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Navarro', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apellido1?: string;

  @ApiPropertyOptional({ example: 'Castro', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apellido2?: string;

  // Campos para institucional
  @ApiPropertyOptional({ example: 'Liceo de Heredia Renovado', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  razonSocial?: string;

  @ApiPropertyOptional({ example: 'Contacto Nuevo', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreContacto?: string;

  @ApiPropertyOptional({ example: '2260-9999', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefonoContacto?: string;

  @ApiPropertyOptional({ example: 'contacto@liceoheredia.ed.cr', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  correoContacto?: string;
}

export class ConsultarHistorialDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}

export class AutorizarCondicionPagoDto {
  @ApiProperty({ example: 2, description: 'ID de la condición de pago (ej. 2 = Crédito 15 días)' })
  @IsInt()
  @Min(1)
  idCondicionPago: number;
}
