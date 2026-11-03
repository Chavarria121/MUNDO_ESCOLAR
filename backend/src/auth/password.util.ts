import * as bcrypt from 'bcryptjs';
import { createHash, timingSafeEqual } from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Genera un hash criptográfico seguro con sal usando bcrypt (12 rondas de costo).
 * Elimina completamente el uso de hashes SHA-256 sin sal para nuevas credenciales (Remediación S02).
 */
export function hashContrasena(textoPlano: string): string {
  return bcrypt.hashSync(textoPlano, SALT_ROUNDS);
}

/**
 * Verifica una contraseña en texto plano contra el hash almacenado.
 * 1. Soporta hashes modernos bcrypt ($2a$, $2b$, $2y$).
 * 2. Mantiene compatibilidad con hashes legados SHA-256 (64 hex mayúsculas)
 *    utilizando comparación en tiempo constante (timingSafeEqual) para evitar fugas de canal lateral.
 */
export function verificarContrasena(textoPlano: string, hashAlmacenado: string): boolean {
  if (!textoPlano || !hashAlmacenado) return false;

  const hash = String(hashAlmacenado).trim();

  // 1. Verificación segura con bcrypt
  if (hash.startsWith('$2')) {
    return bcrypt.compareSync(textoPlano, hash);
  }

  // 2. Verificación de compatibilidad con hash legado SHA-256
  const legacyHash = createHash('sha256').update(textoPlano, 'latin1').digest('hex').toUpperCase();
  const bufferCalculado = Buffer.from(legacyHash, 'utf8');
  const bufferAlmacenado = Buffer.from(hash.toUpperCase(), 'utf8');

  if (bufferCalculado.length !== bufferAlmacenado.length) {
    return false;
  }
  return timingSafeEqual(bufferCalculado, bufferAlmacenado);
}
