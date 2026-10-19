import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../decorators/requiere-permisos.decorator';
import { UsuarioSesion } from '../interfaces/usuario-sesion.interface';

/**
 * Autorización basada en la matriz Rol_Permiso de SQL Server.
 * Los permisos del usuario se leyeron de la BD en esta misma petición (JwtStrategy),
 * por lo que un cambio en Rol_Permiso o Rol_Usuario surte efecto de inmediato.
 */
@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requeridos || requeridos.length === 0) return true;

    const usuario: UsuarioSesion | undefined = context.switchToHttp().getRequest().user;
    if (!usuario) throw new UnauthorizedException('Sesión no válida.');

    const faltantes = requeridos.filter((p) => !usuario.permisos.includes(p));
    if (faltantes.length) {
      throw new ForbiddenException(`Acceso denegado. Permiso requerido: ${faltantes.join(', ')}`);
    }
    return true;
  }
}
