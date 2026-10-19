import { Injectable } from '@nestjs/common';
import { SqlService } from './database/sql.service';

@Injectable()
export class AppService {
  constructor(private readonly sqlService: SqlService) {}

  getApiInfo() {
    return {
      sistema: 'Librería y Papelería Mundo Escolar',
      descripcion: 'API Backend Delgada (Database-First) para SQL Server 2022',
      version: '2.0.0',
      documentacionSwagger: '/api/docs',
      estado: 'ACTIVO',
    };
  }

  async getHealth() {
    return await this.sqlService.healthCheck();
  }
}
