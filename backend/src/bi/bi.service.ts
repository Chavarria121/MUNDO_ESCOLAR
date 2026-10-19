import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { CargarDimFechaDto } from './dto/bi.dto';

@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  constructor(private readonly sql: SqlService) {}

  async cargarDimFecha(dto: CargarDimFechaDto) {
    return this.sql.consultarSP('SP_ETL_CargarDimFecha', {
      AnioInicio: dto.anioInicio ?? 2024,
      AnioFin: dto.anioFin ?? 2030,
    });
  }

  async cargarDimensiones() {
    const [cliente, prod, serv, cond, metodo, vend] = await Promise.all([
      this.sql.consultarSP('SP_ETL_CargarDimCliente'),
      this.sql.consultarSP('SP_ETL_CargarDimProducto'),
      this.sql.consultarSP('SP_ETL_CargarDimServicio'),
      this.sql.consultarSP('SP_ETL_CargarDimCondicionPago'),
      this.sql.consultarSP('SP_ETL_CargarDimMetodoPago'),
      this.sql.consultarSP('SP_ETL_CargarDimVendedor'),
    ]);
    return {
      DimCliente: cliente[0],
      DimProducto: prod[0],
      DimServicio: serv[0],
      DimCondicionPago: cond[0],
      DimMetodoPago: metodo[0],
      DimVendedor: vend[0],
    };
  }

  async cargarHechos() {
    const [ventas, vtaProd, vtaServ, pagos] = await Promise.all([
      this.sql.consultarSP('SP_ETL_CargarFactVentas'),
      this.sql.consultarSP('SP_ETL_CargarFactVentaProducto'),
      this.sql.consultarSP('SP_ETL_CargarFactVentaServicio'),
      this.sql.consultarSP('SP_ETL_CargarFactPagos'),
    ]);
    return {
      FactVentas: ventas[0],
      FactVentaProducto: vtaProd[0],
      FactVentaServicio: vtaServ[0],
      FactPagos: pagos[0],
    };
  }

  async ejecutarCargaCompleta(dto: CargarDimFechaDto) {
    this.logger.log('Iniciando ejecución completa de ETL de Constelación...');
    await this.cargarDimFecha(dto);
    const dimensiones = await this.cargarDimensiones();
    const hechos = await this.cargarHechos();
    const conciliacion = await this.validarConciliacion();
    return {
      mensaje: 'Proceso ETL de Constelación completado exitosamente.',
      dimensiones,
      hechos,
      conciliacion,
    };
  }

  validarConciliacion() {
    return this.sql.consultarSP('SP_ETL_ValidarConciliacionCargas');
  }
}
