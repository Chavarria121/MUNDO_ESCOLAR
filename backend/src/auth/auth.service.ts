import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SqlService } from '../database/sql.service';
import { hashContrasena, verificarContrasena } from './password.util';
import { JwtPayload, UsuarioSesion } from './interfaces/usuario-sesion.interface';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';

interface FilaAutenticacion {
  Id_Usuario: number;
  Nombre_Usuario: string;
  Correo: string;
  HashContrasena: string;
  Estado: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly sql: SqlService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** SP_Permiso_ConsultarUsuario: permisos efectivos según Rol_Usuario + Rol_Permiso. */
  private async permisosDe(idUsuario: number): Promise<string[]> {
    const filas = await this.sql.consultarSP<{ Nombre_Permiso: string }>('SP_Permiso_ConsultarUsuario', {
      Id_Usuario: idUsuario,
    });
    return filas.map((f) => f.Nombre_Permiso);
  }

  async login(nombreUsuario: string, contrasena: string) {
    // SP 55 del catálogo: entrega al backend solo lo mínimo para autenticar
    const fila = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerParaAutenticacion', {
      Nombre_Usuario: nombreUsuario,
    });

    // Mensaje genérico: no revelar si el usuario existe
    if (!fila || !verificarContrasena(contrasena, fila.HashContrasena)) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }
    if (!fila.Estado) {
      throw new ForbiddenException('El usuario se encuentra inactivo.');
    }

    const permisos = await this.permisosDe(fila.Id_Usuario);
    const payload: JwtPayload = { sub: fila.Id_Usuario, nombreUsuario: fila.Nombre_Usuario };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tipoToken: 'Bearer',
      expiraEn: this.config.get<string>('jwt.expiresIn'),
      usuario: { idUsuario: fila.Id_Usuario, nombreUsuario: fila.Nombre_Usuario, correo: fila.Correo },
      permisos,
    };
  }

  /** Reconstruye la sesión desde SQL Server en cada petición autenticada. */
  async construirSesion(payload: JwtPayload): Promise<UsuarioSesion> {
    const fila = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerParaAutenticacion', {
      Nombre_Usuario: payload.nombreUsuario,
    });
    if (!fila || fila.Id_Usuario !== payload.sub) throw new UnauthorizedException('Sesión no válida.');
    if (!fila.Estado) throw new UnauthorizedException('El usuario fue desactivado.');

    return {
      idUsuario: fila.Id_Usuario,
      nombreUsuario: fila.Nombre_Usuario,
      correo: fila.Correo,
      permisos: await this.permisosDe(fila.Id_Usuario),
    };
  }

  /** Permite al usuario autenticado actualizar su contraseña de forma segura. */
  async cambiarContrasena(idUsuario: number, dto: CambiarContrasenaDto) {
    const filas = await this.sql.consultarQuery<{ Id_Usuario: number; Contrasena: string; Estado: boolean }>(
      'SELECT Id_Usuario, Contrasena, Estado FROM Usuario WHERE Id_Usuario = @id',
      { id: idUsuario },
    );
    const usuario = filas[0];
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    if (!usuario.Estado) {
      throw new ForbiddenException('El usuario se encuentra inactivo.');
    }
    if (!verificarContrasena(dto.contrasenaActual, usuario.Contrasena)) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }
    if (dto.contrasenaNueva === dto.contrasenaActual) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la contraseña actual.');
    }

    const nuevaHash = hashContrasena(dto.contrasenaNueva);
    await this.sql.consultarQuery(
      'UPDATE Usuario SET Contrasena = @nuevaHash WHERE Id_Usuario = @id',
      { nuevaHash, id: idUsuario },
    );

    await this.sql.consultarQuery(
      `INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
       VALUES (@id, 'PASSWORD_CHANGE', 'Usuario', @id, GETDATE(), 'Cambio de contraseña efectuado exitosamente.')`,
      { id: idUsuario },
    );

    return { mensaje: 'Contraseña actualizada exitosamente.' };
  }
}
