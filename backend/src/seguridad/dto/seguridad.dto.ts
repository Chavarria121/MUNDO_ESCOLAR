import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsString, MaxLength, Min, MinLength } from 'class-validator';

// Nota: las validaciones aquí son solo de TRANSPORTE (tipo, obligatoriedad y longitud de columna).
// Las reglas de negocio (correo válido, duplicados, último administrador, etc.) las aplican los SPs.

export class CrearUsuarioDto {
  @ApiProperty({ example: 'ana.mora', maxLength: 50 })
  @IsString() @IsNotEmpty() @MaxLength(50)
  nombreUsuario: string;

  @ApiProperty({ example: 'ana.mora@mundoescolar.cr', maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  correo: string;

  @ApiProperty({ example: 'Clave2026!', minLength: 8, description: 'Se transforma a SHA2_256 antes de enviarse al SP.' })
  @IsString() @MinLength(8) @MaxLength(128)
  contrasena: string;
}

export class AsignarRolDto {
  @ApiProperty({ example: 2 })
  @IsInt() @Min(1)
  idRol: number;
}

export class CrearRolDto {
  @ApiProperty({ example: 'Supervisor', maxLength: 100 })
  @IsString() @IsNotEmpty() @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Supervisión de caja y reportes', maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  descripcion: string;
}

export class ActualizarRolDto extends CrearRolDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  estado: boolean;
}

export class AsignarPermisoDto {
  @ApiProperty({ example: 16 })
  @IsInt() @Min(1)
  idPermiso: number;
}

export class GuardarPermisoDto {
  @ApiProperty({ example: 'REPORTES_EXPORTAR', maxLength: 100 })
  @IsString() @IsNotEmpty() @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Permite exportar reportes', maxLength: 255 })
  @IsString() @IsNotEmpty() @MaxLength(255)
  descripcion: string;
}
