jest.mock('@nestjs/config', () => ({
  ConfigService: class {
    get(key: string) {
      return null;
    }
  },
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({ module: class {} }),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SqlService } from './database/sql.service';

describe('AppController', () => {
  let appController: AppController;

  const mockSqlService = {
    healthCheck: jest.fn().mockResolvedValue({
      status: 'ONLINE',
      info: { BaseDatos: 'MUNDO_ESCOLAR' },
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: SqlService, useValue: mockSqlService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root (getInfo)', () => {
    it('debe retornar la información del sistema y versión 2.0.0', () => {
      const info = appController.getInfo();
      expect(info).toBeDefined();
      expect(info.sistema).toBe('Librería y Papelería Mundo Escolar');
      expect(info.version).toBe('2.0.0');
      expect(info.estado).toBe('ACTIVO');
    });
  });

  describe('health (getHealth)', () => {
    it('debe retornar diagnóstico ONLINE de SQL Server', async () => {
      const health = await appController.getHealth();
      expect(health).toEqual({
        status: 'ONLINE',
        info: { BaseDatos: 'MUNDO_ESCOLAR' },
      });
    });
  });
});
