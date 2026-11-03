export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    name: process.env.DB_NAME || 'MUNDO_ESCOLAR',
    user: process.env.DB_USER || 'login_mundo_app',
    password: process.env.DB_PASSWORD || '',
    encrypt: process.env.DB_ENCRYPT !== 'false', // Cifrado TLS activado por defecto (Seguro por diseño)
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true', // Validación de certificado estricta por defecto
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'MundoEscolar_SuperSecret_Torrentes2026_JWTKey_33Tablas!',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
});
