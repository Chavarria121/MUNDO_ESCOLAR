import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CargarDimFechaDto {
  @ApiPropertyOptional({ example: 2024, default: 2024 })
  @IsInt()
  @Min(2000)
  @IsOptional()
  anioInicio?: number;

  @ApiPropertyOptional({ example: 2030, default: 2030 })
  @IsInt()
  @Max(2100)
  @IsOptional()
  anioFin?: number;
}
