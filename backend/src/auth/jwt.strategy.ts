import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload, UsuarioSesion } from './interfaces/usuario-sesion.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (configService.get<string>('jwt.secret') || process.env.JWT_SECRET || 'MundoEscolar_Secret_Super_Seguro_2026*') as string,
    });
  }

  /** En cada petición se revalida contra SQL Server que el usuario siga activo y sus permisos. */
  async validate(payload: JwtPayload): Promise<UsuarioSesion> {
    return this.authService.construirSesion(payload);
  }
}
