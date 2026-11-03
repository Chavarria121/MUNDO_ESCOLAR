import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class MantenimientoIndicesDto {
  @ApiProperty({ example: 'SoloAnalizar', description: "'SoloAnalizar' o 'Ejecutar'" })
  @IsIn(['SoloAnalizar', 'Ejecutar', 'soloanalizar', 'ejecutar'])
  modo: string;
}

export class ConsultarHistorialBackupsDto {
  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  diasAtras?: number;
}

export class EjecutarBackupDto {
  // El directorio de respaldo está confinado estrictamente en el servidor (C:\SQLBackup)
  // Se elimina la recepción de ruta desde el cliente para prevenir manipulación externa.
}

export class VerificarIntegridadBackupDto {
  @ApiProperty({ example: 'C:\\SQLBackup\\MUNDO_ESCOLAR_FULL_20261102_212310_4D6333B3-B85F-400F-AB64-9B17FFD934C8.bak' })
  @IsString()
  @MaxLength(500)
  rutaArchivoBak: string;
}
