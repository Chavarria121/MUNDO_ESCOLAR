jest.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({ module: class {} }),
  },
  ConfigService: class {
    get(key: string) {
      if (key === 'database.server') return 'localhost';
      if (key === 'database.name') return 'MUNDO_ESCOLAR';
      if (key === 'database.user') return 'sa';
      if (key === 'database.password') return 'MundoEscolar2026*';
      if (key === 'database.port') return 1433;
      if (key === 'database.encrypt') return false;
      if (key === 'database.trustServerCertificate') return true;
      return null;
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

class MockConfigService {
  get(key: string) {
    if (key === 'database.server') return 'localhost';
    if (key === 'database.name') return 'MUNDO_ESCOLAR';
    if (key === 'database.user') return 'sa';
    if (key === 'database.password') return 'MundoEscolar2026*';
    if (key === 'database.port') return 1433;
    if (key === 'database.encrypt') return false;
    if (key === 'database.trustServerCertificate') return true;
    return null;
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        SqlService,
        { provide: ConfigService, useClass: MockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET) - Información de API', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.body).toHaveProperty('sistema', 'Librería y Papelería Mundo Escolar');
    expect(response.body).toHaveProperty('version', '2.0.0');
    expect(response.body).toHaveProperty('estado', 'ACTIVO');
  });

  it('/health (GET) - Diagnóstico de Base de Datos', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toHaveProperty('status', 'ONLINE');
    expect(response.body.info).toHaveProperty('BaseDatos', 'MUNDO_ESCOLAR');
  });
});
