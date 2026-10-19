import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioSesion } from '../interfaces/usuario-sesion.interface';

/** Inyecta en el controlador el usuario autenticado (req.user). */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioSesion => ctx.switchToHttp().getRequest().user,
);
