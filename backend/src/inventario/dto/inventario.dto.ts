import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class EntradaInventarioDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  idProducto: number;

  @ApiProperty({ example: 25, description: 'Cantidad física a ingresar' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({ example: 'Ingreso extraordinario por inventario inicial de bodega', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class SalidaInventarioDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  idProducto: number;

  @ApiProperty({ example: 5, description: 'Cantidad a egresar del stock' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({ example: 'Merma por daño de empaque durante almacenamiento', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class AjusteInventarioDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsInt()
  @Min(1)
  idProducto: number;

  @ApiProperty({ example: 45, description: 'Stock físico real verificado en conteo' })
  @IsInt()
  @Min(0)
  stockFisicoReal: number;

  @ApiProperty({ example: 'Conteo trimestral de bodega pasillo 3', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class RevertirMovimientoDto {
  @ApiProperty({ example: 'Corrección por digitación errónea de cantidad', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class ConsultarMovimientosDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idProducto?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del tipo de movimiento (1..6)' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idTipoMovimiento?: number;
}
