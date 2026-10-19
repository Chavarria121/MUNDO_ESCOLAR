import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GenerarFacturaDto {
  @ApiProperty({ example: 1, description: 'ID de la venta confirmada a facturar' })
  @IsInt()
  @Min(1)
  idVenta: number;
}

export class AnularFacturaDto {
  @ApiProperty({ example: 'Error de digitación en condición de pago reportada por cliente', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}

export class ConsultarFacturasDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idFactura?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idVenta?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idCliente?: number;

  @ApiPropertyOptional({ example: 1, description: '1=Emitida, 2=Pagada, 3=Parcial, 4=Anulada' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idEstadoFactura?: number;
}
