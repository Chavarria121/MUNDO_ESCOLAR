import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Traduce los errores de SQL Server a respuestas HTTP.
 * Los procedimientos almacenados lanzan THROW con números 50000-59999: ese mensaje es la
 * regla de negocio que decidió la base de datos y se entrega tal cual al cliente.
 */
@Catch()
export class SqlExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SqlExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje: string | string[] = 'Error interno del servidor.';
    let errorSQL: number | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      mensaje = typeof resp === 'object' && resp && 'message' in resp ? (resp as any).message : exception.message;
    } else if (typeof exception?.number === 'number' || typeof exception?.originalError?.info?.number === 'number') {
      errorSQL = exception.number ?? exception.originalError?.info?.number;
      const texto: string = exception.message || 'Error en el motor de base de datos.';

      if (errorSQL! >= 50000 && errorSQL! <= 59999) {
        // Regla de negocio validada por un procedimiento almacenado
        status = /no existe|no encontrad/i.test(texto) ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        mensaje = texto;
      } else if (errorSQL === 2627 || errorSQL === 2601) {
        status = HttpStatus.CONFLICT;
        mensaje = 'Ya existe un registro con esos datos únicos (restricción UNIQUE/PK).';
      } else if (errorSQL === 547) {
        status = HttpStatus.BAD_REQUEST;
        mensaje = 'La operación viola una restricción de integridad (FK o CHECK).';
      } else if (errorSQL === 229 || errorSQL === 230) {
        status = HttpStatus.FORBIDDEN;
        mensaje = 'Permiso denegado por SQL Server.';
      } else {
        mensaje = `Error de SQL Server [${errorSQL}]: ${texto}`;
      }
      this.logger.warn(`[SQL ${errorSQL}] ${request.method} ${request.url} -> ${texto}`);
    } else {
      this.logger.error(`${request.method} ${request.url}: ${exception?.message}`, exception?.stack);
    }

    response.status(status).json({
      statusCode: status,
      exito: false,
      mensaje,
      errorSQL,
      ruta: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
