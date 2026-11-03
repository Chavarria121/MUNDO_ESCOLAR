import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SqlService } from '../database/sql.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private blacklistedTokens = new Map<string, number>();

  constructor(private readonly sql: SqlService) {}

  /**
   * Genera una huella SHA-256 única para el token, evitando almacenar JWTs en texto plano.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Registra un token en la lista negra en memoria (L1) y persiste en SQL Server (L2)
   * garantizando la revocación efectiva incluso ante reinicios del backend.
   */
  async revocarToken(token: string, expiraEnMs: number): Promise<void> {
    const tokenHash = this.hashToken(token);
    this.blacklistedTokens.set(tokenHash, expiraEnMs);

    try {
      await this.sql.ejecutarSP('SP_Token_Revocar', {
        Token_Hash: tokenHash,
        Fecha_Expiracion: new Date(expiraEnMs),
      });
    } catch (err: any) {
      this.logger.warn(`No se pudo persistir la revocación en BD: ${err?.message}`);
    }
  }

  /**
   * Comprueba si el token se encuentra revocado.
   * Consulta primero la caché L1 en memoria y recurre a SQL Server si hubo reinicio.
   */
  async estaRevocado(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const ahora = Date.now();
    const expiraEn = this.blacklistedTokens.get(tokenHash);

    if (expiraEn !== undefined) {
      if (ahora > expiraEn) {
        this.blacklistedTokens.delete(tokenHash);
        return false;
      }
      return true;
    }

    try {
      const fila = await this.sql.consultarSPUno<{ EstaRevocado: boolean }>('SP_Token_VerificarRevocado', {
        Token_Hash: tokenHash,
      });

      if (fila?.EstaRevocado) {
        this.blacklistedTokens.set(tokenHash, ahora + 3600000);
        return true;
      }
    } catch (err: any) {
      this.logger.warn(`Error al verificar revocación en BD: ${err?.message}`);
    }

    return false;
  }
}
