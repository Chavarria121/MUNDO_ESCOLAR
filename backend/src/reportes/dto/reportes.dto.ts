import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class ProductosMasVendidosDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  fechaFin: string;
}

export class VentasPorPeriodoDto {
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

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idUsuario?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCondicionPago?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idEstadoVenta?: number;
}

export class VentasPorClienteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  idCliente: number;

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
  idCondicionPago?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idEstadoVenta?: number;
}

export class ComprasPorProveedorDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  idProveedor: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idEstadoCompra?: number;
}

export class CuentasVencidasDto {
  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaCorte?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCliente?: number;
}

export class FacturasPendientesDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCliente?: number;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaCorte?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCondicionPago?: number;
}

export class MovimientosInventarioReporteDto {
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

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idTipoMovimiento?: number;
}

export class ActividadUsuarioReporteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  idUsuario: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}
