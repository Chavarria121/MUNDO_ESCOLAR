import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ConsultarAuditoriaDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  idUsuario?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @ApiPropertyOptional({ example: 'Venta', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tabla?: string;
}

export class RegistrarEventoAuditoriaDto {
  @ApiProperty({ example: 'LOGIN_EXITOSO', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  accion: string;

  @ApiProperty({ example: 'SEGURIDAD', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tablaAfectada: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  idRegistroAfectado?: number;

  @ApiPropertyOptional({ example: 'Inicio de sesión desde portal administrativo', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  descripcion?: string;
}
