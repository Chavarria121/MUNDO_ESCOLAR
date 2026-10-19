import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Sistema & Diagnóstico')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Información general de la API de Mundo Escolar' })
  @ApiResponse({ status: 200, description: 'Información del sistema y versión.' })
  getInfo() {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificación del estado de conexión con SQL Server 2022' })
  @ApiResponse({ status: 200, description: 'Diagnóstico de conectividad y conteo de objetos en MUNDO_ESCOLAR.' })
  getHealth() {
    return this.appService.getHealth();
  }
}
