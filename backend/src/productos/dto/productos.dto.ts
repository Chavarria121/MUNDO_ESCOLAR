import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearProductoDto {
  @ApiProperty({ example: 1, description: 'ID de la categoría a la que pertenece' })
  @IsInt()
  @Min(1)
  idCategoria: number;

  @ApiProperty({ example: 'Cuaderno Doble Raya 100 Hojas', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiPropertyOptional({ example: 'Cuaderno cosido doble raya pasta dura', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  descripcion?: string;

  @ApiProperty({ example: 1850.0, description: 'Precio de venta al público en CRC' })
  @IsNumber()
  @IsPositive()
  precioVenta: number;

  @ApiPropertyOptional({ example: 50, default: 0, description: 'Stock físico inicial' })
  @IsInt()
  @Min(0)
  @IsOptional()
  stockInicial?: number;

  @ApiPropertyOptional({ example: 10, default: 0, description: 'Nivel mínimo para alerta de reorden' })
  @IsInt()
  @Min(0)
  @IsOptional()
  puntoReorden?: number;
}

export class ActualizarProductoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  idCategoria: number;

  @ApiProperty({ example: 'Cuaderno Doble Raya 100 Hojas Renovado', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiPropertyOptional({ example: 'Pasta dura mejorada', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  descripcion?: string;

  @ApiProperty({ example: 1950.0 })
  @IsNumber()
  @IsPositive()
  precioVenta: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(0)
  puntoReorden: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  estado: boolean;
}

export class ConsultarProductosDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCategoria?: number;

  @ApiPropertyOptional({ example: 'cuaderno' })
  @IsString()
  @IsOptional()
  busqueda?: string;
}

// ---------------- SERVICIOS DTOs ----------------
export class CrearServicioDto {
  @ApiProperty({ example: 'Impresión Láser Color', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiPropertyOptional({ example: 'Impresión en papel bond tamaño carta a color', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  descripcion?: string;

  @ApiProperty({ example: 125.0, description: 'Precio base unitario en CRC' })
  @IsNumber()
  @IsPositive()
  precioBase: number;
}

export class ActualizarServicioDto {
  @ApiProperty({ example: 'Impresión Láser Color HQ', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  nombre: string;

  @ApiPropertyOptional({ example: 'Resolución de 1200 dpi', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  descripcion?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  precioBase: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  estado: boolean;
}

export class ConsultarServiciosDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: 'impresion' })
  @IsString()
  @IsOptional()
  busqueda?: string;
}
