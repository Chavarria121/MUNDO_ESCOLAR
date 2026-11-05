import * as dotenv from 'dotenv';
dotenv.config();

const jwt = require('jsonwebtoken');

const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin2026!';
const JWT_TEST_SECRET = process.env.JWT_SECRET || 'MundoEscolar_SuperSecret_Torrentes2026_JWTKey_33Tablas!';

jest.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({ module: class {} }),
  },
  ConfigService: class {
    get(key: string) {
      if (key === 'database.server') return process.env.DB_SERVER || 'localhost';
      if (key === 'database.name') return process.env.DB_NAME || 'MUNDO_ESCOLAR';
      if (key === 'database.user') return process.env.DB_USER || 'login_mundo_app';
      if (key === 'database.password') return process.env.DB_PASSWORD || '';
      if (key === 'database.port') return Number(process.env.DB_PORT) || 1433;
      if (key === 'database.encrypt') return process.env.DB_ENCRYPT !== 'false';
      if (key === 'database.trustServerCertificate') return process.env.DB_TRUST_SERVER_CERTIFICATE === 'true';
      if (key === 'jwt.secret') return JWT_TEST_SECRET;
      if (key === 'jwt.expiresIn') return process.env.JWT_EXPIRES_IN || '8h';
      return null;
    }
  },
}));

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => class {
    async canActivate(context: any) {
      const req = context.switchToHttp().getRequest();
      const authHeader = (req.headers as any)['authorization'] || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (!token) return false;
      try {
        const decoded = jwt.verify(token, JWT_TEST_SECRET);
        req.user = {
          idUsuario: decoded.sub,
          nombreUsuario: decoded.nombreUsuario,
          correo: 'admin@mundoescolar.cr',
          permisos: ['DBA_MANTENIMIENTO', 'SEGURIDAD_GESTIONAR', 'ADMIN', 'CLIENTES_CONSULTAR', 'CLIENTES_GESTIONAR'],
          requiereCambioContrasena: Boolean(decoded.requiereCambioContrasena),
        };
        return true;
      } catch {
        return false;
      }
    }
  },
  PassportStrategy: (strategy: any) => class {},
  PassportModule: { register: () => ({ module: class {} }) },
}));

jest.mock('@nestjs/jwt', () => ({
  JwtService: class {
    signAsync(payload: any) {
      return Promise.resolve(jwt.sign(payload, JWT_TEST_SECRET, { expiresIn: '8h' }));
    }
    decode(token: string) {
      return jwt.decode(token);
    }
    verify(token: string) {
      return jwt.verify(token, JWT_TEST_SECRET);
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { SqlService } from './../src/database/sql.service';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './../src/auth/auth.controller';
import { AuthService } from './../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from './../src/auth/token-blacklist.service';
import { DbaController } from './../src/dba/dba.controller';
import { DbaService } from './../src/dba/dba.service';
import { ClientesController } from './../src/clientes/clientes.controller';
import { ClientesService } from './../src/clientes/clientes.service';

class MockConfigService {
  get(key: string) {
    if (key === 'database.server') return process.env.DB_SERVER || 'localhost';
    if (key === 'database.name') return process.env.DB_NAME || 'MUNDO_ESCOLAR';
    if (key === 'database.user') return process.env.DB_USER || 'login_mundo_app';
    if (key === 'database.password') return process.env.DB_PASSWORD || '';
    if (key === 'database.port') return Number(process.env.DB_PORT) || 1433;
    if (key === 'database.encrypt') return process.env.DB_ENCRYPT !== 'false';
    if (key === 'database.trustServerCertificate') return process.env.DB_TRUST_SERVER_CERTIFICATE === 'true';
    if (key === 'jwt.secret') return JWT_TEST_SECRET;
    if (key === 'jwt.expiresIn') return process.env.JWT_EXPIRES_IN || '8h';
    return null;
  }
}

describe('Mundo Escolar API (e2e) - Suite Completa de Seguridad, Auditoría y DBA', () => {
  let app: INestApplication<App>;
  let validToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, AuthController, DbaController, ClientesController],
      providers: [
        AppService,
        SqlService,
        AuthService,
        JwtService,
        TokenBlacklistService,
        DbaService,
        ClientesService,
        { provide: ConfigService, useClass: MockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // 1. Diagnóstico e Información del Sistema
  it('/ (GET) - Información de API', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.body).toHaveProperty('sistema', 'Librería y Papelería Mundo Escolar');
    expect(response.body).toHaveProperty('version', '2.0.0');
    expect(response.body).toHaveProperty('estado', 'ACTIVO');
  });

  it('/health (GET) - Diagnóstico de Base de Datos y Conexión Segura', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toHaveProperty('status', 'ONLINE');
    expect(response.body).toHaveProperty('info');
  });

  // 2. Flujo de Autenticación y Verificación de Credenciales
  it('/auth/login (POST) - Autenticación exitosa y emisión de token JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nombreUsuario: 'admin', contrasena: TEST_ADMIN_PASSWORD })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('usuario');
    expect(response.body.usuario).toHaveProperty('nombreUsuario', 'admin');
    validToken = response.body.accessToken;
  });

  it('/auth/login (POST) - Rechazo con 401 en credenciales inválidas', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nombreUsuario: 'admin', contrasena: 'ClaveErronea2026*' })
      .expect(401);

    expect(response.body.message).toContain('Usuario o contraseña incorrectos');
  });

  // 3. Consulta de Perfil Protegido con Bearer Token
  it('/auth/me (GET) - Consulta de perfil de sesión con token vigente', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('idUsuario');
    expect(response.body).toHaveProperty('nombreUsuario', 'admin');
  });

  // 4. Cierre de Sesión Seguro e Invalidación de Token (Lista Negra)
  it('/auth/logout (POST) - Revocación efectiva del token en lista negra', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('mensaje', 'Sesión cerrada exitosamente.');

    // Comprobación técnica de remediación: el token revocado DEBE ser rechazado en subsecuentes peticiones
    const rechazo = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(401);

    expect(rechazo.body.message).toContain('El token ha sido revocado');
  });

  // 5. Historial de Respaldos DBA con Token Válido
  it('/dba/backups/historial (GET) - Consulta de catálogo de respaldos bajo PoLP', async () => {
    await new Promise((r) => setTimeout(r, 1100));

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nombreUsuario: 'admin', contrasena: TEST_ADMIN_PASSWORD })
      .expect(200);

    const tokenDba = loginRes.body.accessToken;

    const response = await request(app.getHttpServer())
      .get('/dba/backups/historial')
      .set('Authorization', `Bearer ${tokenDba}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  // 6. Registro de Cliente Particular bajo PoLP (Sin consultas directas a Usuario)
  it('/clientes/particular (POST) - Registro exitoso validando unicidad mediante SP', async () => {
    const rnd = Math.floor(10000000 + Math.random() * 90000000);
    const dto = {
      identificacion: `1-${rnd.toString().slice(0, 4)}-${rnd.toString().slice(4)}`,
      nombre: 'Prueba E2E',
      apellido1: 'Audit',
      apellido2: 'PoLP',
      telefono: '8888-9999',
      direccion: 'San José, Costa Rica',
      nombreUsuario: `user_${rnd}`,
      correo: `user_${rnd}@mundoescolar.cr`,
      contrasena: 'ClientePass2026*',
    };

    const res = await request(app.getHttpServer())
      .post('/clientes/particular')
      .send(dto)
      .expect(201);

    expect(res.body).toHaveProperty('Id_Cliente');
  });

  // 7. Detección de conflicto / duplicidad mediante SP_Usuario_VerificarDisponibilidad
  it('/clientes/particular (POST) - Conflicto 409 cuando el correo o usuario ya existe', async () => {
    const dtoDuplicado = {
      identificacion: '1-0000-0000',
      nombre: 'Admin Duplicado',
      apellido1: 'Test',
      apellido2: 'Test',
      nombreUsuario: 'admin', // Usuario existente
      correo: 'admin@mundoescolar.cr', // Correo existente
      contrasena: 'ClientePass2026*',
    };

    const res = await request(app.getHttpServer())
      .post('/clientes/particular')
      .send(dtoDuplicado)
      .expect(409);

    expect(res.body.message).toContain('ya se encuentra registrado');
  });
  // 8. Consulta de Capacidad Crediticia, Morosidad Endurecida y Umbrales Comerciales
  it('/clientes/:id/estado-credito (GET) - Consulta de capacidad comercial y validación de morosidad', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ nombreUsuario: 'admin', contrasena: TEST_ADMIN_PASSWORD })
      .expect(200);

    const token = loginRes.body.accessToken;

    const res = await request(app.getHttpServer())
      .get('/clientes/1/estado-credito')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('idCliente', 1);
    expect(res.body).toHaveProperty('esMoroso');
    expect(res.body).toHaveProperty('limiteCreditoMonto');
    expect(res.body).toHaveProperty('limiteFacturas');
    expect(res.body).toHaveProperty('puedeComprarContado');
    expect(res.body).toHaveProperty('puedeComprarCredito');
  });
});
