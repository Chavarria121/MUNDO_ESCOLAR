import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SqlExceptionFilter } from './common/filters/sql-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (!process.env.JWT_SECRET) {
    logger.error('Falta JWT_SECRET en el archivo .env');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new SqlExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Librería y Papelería Mundo Escolar - API')
    .setDescription(
      'API REST delgada (NestJS + TypeScript). Toda la lógica de negocio reside en Microsoft SQL Server: ' +
        'los endpoints solo invocan procedimientos almacenados y vistas. La autorización usa la matriz Rol_Permiso de la BD.',
    )
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    customSiteTitle: 'Mundo Escolar - API Docs',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Servidor listo en http://localhost:${port}/api`);
  logger.log(`Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
