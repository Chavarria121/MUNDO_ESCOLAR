export default () => {
  const isProd = process.env.NODE_ENV === 'production';

  // En producción se exige estrictamente la presencia de variables de entorno críticas
  if (isProd && !process.env.JWT_SECRET) {
    throw new Error('CONFIGURACIÓN INSEGURA: La variable de entorno JWT_SECRET es obligatoria en producción.');
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      server: process.env.DB_SERVER || 'localhost',
      port: parseInt(process.env.DB_PORT || '1433', 10),
      name: process.env.DB_NAME || 'MUNDO_ESCOLAR',
      user: process.env.DB_USER || 'login_mundo_app',
      password: process.env.DB_PASSWORD || '',
      encrypt: process.env.DB_ENCRYPT !== 'false', // TLS activado por defecto (Seguro por diseño)
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // Validación de certificado estricta por defecto
    },
    jwt: {
      // Clave criptográfica provista por variable de entorno (con valor determinista solo para dev/test local documentado)
      secret: process.env.JWT_SECRET || (isProd ? '' : 'MundoEscolar_Dev_Secret_Torrentes2026_JWTKey_33Tablas!'),
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },
  };
};
