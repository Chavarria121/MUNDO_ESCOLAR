import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearVentaDto {
  @ApiProperty({ example: 1, description: 'ID del cliente que realiza la compra' })
  @IsInt()
  @Min(1)
  idCliente: number;

  @ApiProperty({ example: 1, description: 'ID de la condición de pago (1=Contado, etc.) autorizada para el cliente' })
  @IsInt()
  @Min(1)
  idCondicionPago: number;
}

export class AgregarProductoVentaDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  idProducto: number;

  @ApiProperty({ example: 3, description: 'Cantidad de unidades a vender' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({
    example: 1850.0,
    description: 'Precio unitario pactado (si se omite, SQL Server toma Precio_Venta del catálogo)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  precioUnitario?: number;
}

export class AgregarServicioVentaDto {
  @ApiProperty({ example: 1, description: 'ID del servicio (ej. Fotocopia, Impresión, Plastificado)' })
  @IsInt()
  @Min(1)
  idServicio: number;

  @ApiProperty({ example: 10, description: 'Cantidad de servicios' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({
    example: 125.0,
    description: 'Precio unitario pactado (si se omite, SQL Server toma Precio_Base del catálogo)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  precioUnitario?: number;
}

export class ModificarDetalleVentaDto {
  @ApiProperty({ example: 5, description: 'Nueva cantidad' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({ example: 1800.0, description: 'Nuevo precio unitario' })
  @IsNumber()
  @IsPositive()
  precioUnitario: number;
}

export class AnularVentaDto {
  @ApiProperty({ example: 'Cliente canceló el pedido antes de retirar en sucursal', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class ConsultarVentasDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCliente?: number;

  @ApiPropertyOptional({ example: 1, description: '1=Pendiente, 2=Confirmada, 3=Anulada' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idEstadoVenta?: number;
}
