import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class RegistrarPagoDto {
  @ApiProperty({ example: 1, description: 'ID de la factura a la cual se abona o cancela' })
  @IsInt()
  @Min(1)
  idFactura: number;

  @ApiProperty({ example: 1, description: 'ID del método de pago (1=Efectivo, 2=Tarjeta, 3=SINPE Móvil, etc.)' })
  @IsInt()
  @Min(1)
  idMetodoPago: number;

  @ApiProperty({ example: 5000.0, description: 'Monto a pagar en CRC (no puede exceder el saldo pendiente)' })
  @IsNumber()
  @IsPositive()
  montoPagado: number;

  @ApiPropertyOptional({ example: 'REF-SINPE-883921', maxLength: 100, description: 'Número de referencia bancaria o comprobante' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  numeroReferencia?: string;
}

export class AnularPagoDto {
  @ApiProperty({ example: 'Pago registrado por error con método incorrecto', maxLength: 150 })
  @IsString()
  @MaxLength(150)
  motivo: string;
}
