import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearCategoriaDto {
  @ApiProperty({ example: 'Marcadores', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nombre: string;

  @ApiPropertyOptional({ example: 'Marcadores permanentes, para pizarra y fluorescentes', maxLength: 150 })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  descripcion?: string;
}

export class ActualizarCategoriaDto extends CrearCategoriaDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  estado: boolean;
}
