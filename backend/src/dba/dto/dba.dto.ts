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
  @ApiPropertyOptional({ example: 'C:\\SQLBackup', default: 'C:\\SQLBackup', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  rutaCarpetaBackup?: string;
}

export class VerificarIntegridadBackupDto {
  @ApiProperty({ example: 'C:\\SQLBackup\\MUNDO_ESCOLAR_FULL_20261019_125440.bak' })
  @IsString()
  @MaxLength(500)
  rutaArchivoBak: string;
}
