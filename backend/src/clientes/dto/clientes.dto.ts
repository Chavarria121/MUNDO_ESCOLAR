import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

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

  @ApiProperty({ example: 'cliente@ejemplo.com', maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio para registrar el cliente.' })
  @MaxLength(100)
  correo: string;

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

  @ApiPropertyOptional({ example: 'cli.alejandro', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreUsuario?: string;

  @ApiPropertyOptional({ example: 'MiClaveSegura2026!', minLength: 8, maxLength: 50, description: 'Contraseña opcional (si no se envía se autogenera una temporal)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contrasena?: string;
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

  @ApiPropertyOptional({ example: 'Lic. Marvin Campos', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreContacto?: string;

  @ApiPropertyOptional({ example: '2260-1100', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefonoContacto?: string;

  @ApiProperty({ example: 'administracion@liceodeheredia.ed.cr', maxLength: 50 })
  @IsString()
  @IsNotEmpty({ message: 'El correo de contacto es obligatorio para registrar la institución.' })
  @MaxLength(50)
  correoContacto: string;

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

  @ApiPropertyOptional({ example: 'inst.liceo', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreUsuario?: string;

  @ApiPropertyOptional({ example: 'MiClaveSegura2026!', minLength: 8, maxLength: 50, description: 'Contraseña opcional (si no se envía se autogenera una temporal)' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contrasena?: string;
}

export class ActualizarClienteDto {
  @ApiPropertyOptional({ example: 'NuevaClave123!', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contrasena?: string;
  @ApiPropertyOptional({ example: 'cliente@ejemplo.com', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  correo?: string;

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

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  estado?: boolean;

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

  @ApiPropertyOptional({ example: 'Liceo de Heredia', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  razonSocial?: string;

  @ApiPropertyOptional({ example: 'Lic. Marvin Campos', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreContacto?: string;

  @ApiPropertyOptional({ example: '2260-1100', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefonoContacto?: string;

  @ApiPropertyOptional({ example: 'administracion@liceodeheredia.ed.cr', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  correoContacto?: string;
}

export class AutorizarCondicionPagoDto {
  @ApiProperty({ example: 2, description: 'ID de la condición de pago a autorizar (ej. 2 = Crédito 30 Días)' })
  @IsInt()
  @IsNotEmpty()
  idCondicionPago: number;
}

export class ConsultarHistorialGeneralDto {
  @ApiPropertyOptional({ example: 1, description: 'ID del cliente opcional' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCliente?: number;

  @ApiPropertyOptional({ example: 'Particular', description: 'Particular o Institucional' })
  @IsString()
  @IsOptional()
  tipoCliente?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha de inicio del rango' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha fin del rango' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 'Confirmada', description: 'Estado de venta' })
  @IsString()
  @IsOptional()
  estadoVenta?: string;
}

export class ConsultarHistorialDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha de inicio del rango' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha fin del rango' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}

export class ActualizarLimitesCreditoDto {
  @ApiProperty({ example: 350000.00, description: 'Nuevo límite de crédito en colones' })
  @Min(0, { message: 'El límite de crédito no puede ser negativo.' })
  limiteCreditoMonto: number;

  @ApiProperty({ example: 3, description: 'Cantidad máxima de facturas a crédito activas simultáneamente' })
  @IsInt({ message: 'El límite de facturas debe ser un número entero.' })
  @Min(1, { message: 'Debe permitir al menos 1 factura a crédito.' })
  limiteCreditoFacturas: number;

  @ApiPropertyOptional({ example: true, description: 'Autoriza o bloquea la opción de comprar a crédito' })
  @IsBoolean()
  @IsOptional()
  permiteCredito?: boolean;
}
