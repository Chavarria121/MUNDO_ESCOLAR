import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private blacklistedTokens = new Map<string, number>();

  /**
   * Registra un token en la lista negra hasta su expiración física en milisegundos.
   */
  revocarToken(token: string, expiraEnMs: number): void {
    this.blacklistedTokens.set(token, expiraEnMs);
  }

  /**
   * Comprueba si el token se encuentra revocado.
   * Limpia automáticamente los tokens caducados en memoria.
   */
  estaRevocado(token: string): boolean {
    const ahora = Date.now();
    const expiraEn = this.blacklistedTokens.get(token);

    if (!expiraEn) return false;

    if (ahora > expiraEn) {
      this.blacklistedTokens.delete(token);
      return false;
    }

    return true;
  }
}
