import { createHash, timingSafeEqual } from 'crypto';

/**
 * Reproduce exactamente CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', @texto), 2) de SQL Server:
 * SHA-256 en hexadecimal MAYÚSCULA y sin prefijo 0x.
 * El contrato de SP_Usuario_Crear (@ContrasenaHash) y SP_Usuario_ObtenerParaAutenticacion
 * (devuelve HashContrasena) establece que la contraseña en texto plano nunca llega a la BD.
 * Se usa 'latin1' porque HASHBYTES sobre VARCHAR opera con la página de códigos Latin1.
 */
export function hashContrasena(textoPlano: string): string {
  return createHash('sha256').update(textoPlano, 'latin1').digest('hex').toUpperCase();
}

/** Comparación en tiempo constante para no filtrar información por temporización. */
export function verificarContrasena(textoPlano: string, hashAlmacenado: string): boolean {
  const calculado = Buffer.from(hashContrasena(textoPlano), 'utf8');
  const almacenado = Buffer.from(String(hashAlmacenado ?? '').toUpperCase(), 'utf8');
  return calculado.length === almacenado.length && timingSafeEqual(calculado, almacenado);
}
