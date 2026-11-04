import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly blacklist: TokenBlacklistService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Verificación de lista negra (Revocación real de token en logout - Cache L1 + SQL L2)
    const authHeader = (request.headers as any)['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token && (await this.blacklist.estaRevocado(token))) {
      throw new UnauthorizedException('El token ha sido revocado (sesión cerrada).');
    }

    // 2. Validación estándar de firma y vigencia del JWT
    const activado = (await super.canActivate(context)) as boolean;
    if (!activado) return false;

    // 3. Control de cambio obligatorio de contraseña (Remediación S03)
    const usuario = request.user;
    if (usuario?.requiereCambioContrasena) {
      const ruta = (request.route?.path || request.url || '').toLowerCase();
      const rutasPermitidas = [
        '/auth/cambiar-contrasena',
        '/auth/logout',
        '/auth/me',
        '/auth/perfil',
        '/clientes/portal/mi-perfil',
      ];

      const esPermitida = rutasPermitidas.some((r) => ruta.includes(r));
      if (!esPermitida) {
        throw new ForbiddenException({
          mensaje: 'Debe cambiar su contraseña obligatoriamente antes de realizar otras operaciones.',
          codigo: 'PASSWORD_CHANGE_REQUIRED',
        });
      }
    }

    return true;
  }
}
