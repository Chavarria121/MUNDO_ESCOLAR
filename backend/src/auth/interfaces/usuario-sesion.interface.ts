export class JwtPayload {
  sub: number;
  nombreUsuario: string;
  requiereCambioContrasena?: boolean;
}

/** Usuario adjuntado a cada petición autenticada (req.user). */
export class UsuarioSesion {
  idUsuario: number;
  nombreUsuario: string;
  correo: string;
  permisos: string[];
  requiereCambioContrasena: boolean;
}
