import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearProveedorParticularDto {
  @ApiProperty({ example: '1-0899-0432', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  identificacion: string;

  @ApiProperty({ example: 'Carlos', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiProperty({ example: 'Gómez', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  apellido1: string;

  @ApiPropertyOptional({ example: 'Sánchez', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apellido2?: string;

  @ApiProperty({ example: 'carlos.proveedor@gmail.com', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  correo: string;

  @ApiProperty({ example: '8888-7777', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  telefono: string;

  @ApiProperty({ example: 'San José, Paseo Colón', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  direccion: string;
}

export class CrearProveedorInstitucionalDto {
  @ApiProperty({ example: '3-101-998877', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  cedulaJuridica: string;

  @ApiProperty({ example: 'Distribuidora Escolar del Valle S.A.', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  razonSocial: string;

  @ApiProperty({ example: 'Laura Mora', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  nombreContacto: string;

  @ApiProperty({ example: '2222-3333', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  telefonoContacto: string;

  @ApiProperty({ example: 'ventas@delvalle.cr', maxLength: 50 })
  @IsEmail()
  @MaxLength(50)
  correoContacto: string;

  @ApiProperty({ example: 'contacto@delvalle.cr', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  correo: string;

  @ApiProperty({ example: '2222-3300', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  telefono: string;

  @ApiProperty({ example: 'Heredia, Parque Industrial Zeta', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  direccion: string;
}

export class ActualizarProveedorDto {
  @ApiProperty({ example: 'proveedor.edit@mundoescolar.cr', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  correo: string;

  @ApiProperty({ example: '8899-0011', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  telefono: string;

  @ApiProperty({ example: 'Nueva Dirección Actualizada', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  direccion: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  estado: boolean;

  // Particular
  @ApiPropertyOptional({ example: 'Carlos', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Gómez', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apellido1?: string;

  @ApiPropertyOptional({ example: 'Sánchez', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apellido2?: string;

  // Institucional
  @ApiPropertyOptional({ example: 'Distribuidora Renovada S.A.', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  razonSocial?: string;

  @ApiPropertyOptional({ example: 'Laura Mora', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nombreContacto?: string;

  @ApiPropertyOptional({ example: '2222-3333', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefonoContacto?: string;

  @ApiPropertyOptional({ example: 'laura@delvalle.cr', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  correoContacto?: string;
}

export class ConsultarProveedoresDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: 'valle' })
  @IsString()
  @IsOptional()
  busqueda?: string;
}

export class AsociarProductoProveedorDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  idProducto: number;

  @ApiProperty({ example: 1, description: 'ID del proveedor' })
  @IsInt()
  @Min(1)
  idProveedor: number;

  @ApiProperty({ example: 950.0, description: 'Precio de compra pactado con este proveedor' })
  @IsNumber()
  @IsPositive()
  precioCompra: number;

  @ApiProperty({ example: true, description: 'Indica si es el proveedor principal para este producto' })
  @IsBoolean()
  esPrincipal: boolean;
}

export class ActualizarProductoProveedorDto {
  @ApiProperty({ example: 980.0 })
  @IsNumber()
  @IsPositive()
  precioCompra: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  esPrincipal: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  estado: boolean;
}

export class ConsultarProductoProveedorDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idProducto?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idProveedor?: number;
}
