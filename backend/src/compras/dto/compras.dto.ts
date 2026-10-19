import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearCompraDto {
  @ApiProperty({ example: 1, description: 'ID del proveedor al que se le realiza la compra' })
  @IsInt()
  @Min(1)
  idProveedor: number;
}

export class AgregarProductoCompraDto {
  @ApiProperty({ example: 1, description: 'ID del producto adquirido' })
  @IsInt()
  @Min(1)
  idProducto: number;

  @ApiProperty({ example: 20, description: 'Cantidad comprada' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({
    example: 950.0,
    description: 'Costo unitario en CRC (si se omite, SQL Server toma el pactado en Producto_Proveedor)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  costoUnitario?: number;
}

export class ModificarDetalleCompraDto {
  @ApiProperty({ example: 25 })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({ example: 920.0 })
  @IsNumber()
  @IsPositive()
  costoUnitario: number;
}

export class AnularCompraDto {
  @ApiProperty({ example: 'Cancelación solicitada por proveedor por falta de despacho', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class ConsultarComprasDto {
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
  idProveedor?: number;

  @ApiPropertyOptional({ example: 1, description: '1=Pendiente, 2=Recibida, 3=Anulada' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idEstadoCompra?: number;
}
