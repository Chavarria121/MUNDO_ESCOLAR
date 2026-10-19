import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  ActividadUsuarioReporteDto,
  ComprasPorProveedorDto,
  CuentasVencidasDto,
  FacturasPendientesDto,
  MovimientosInventarioReporteDto,
  ProductosMasVendidosDto,
  VentasPorClienteDto,
  VentasPorPeriodoDto,
} from './dto/reportes.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly sql: SqlService) {}

  productosMasVendidos(dto: ProductosMasVendidosDto) {
    return this.sql.consultarFuncionTabla('TF_ProductosMasVendidos', [
      new Date(dto.fechaInicio),
      new Date(dto.fechaFin),
    ]);
  }

  ventasPorPeriodo(dto: VentasPorPeriodoDto) {
    return this.sql.consultarFuncionTabla('TF_VentasPorPeriodo', [
      dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      dto.fechaFin ? new Date(dto.fechaFin) : null,
      dto.idCliente ?? null,
      dto.idUsuario ?? null,
      dto.idCondicionPago ?? null,
      dto.idEstadoVenta ?? null,
    ]);
  }

  ventasPorCliente(dto: VentasPorClienteDto) {
    return this.sql.consultarFuncionTabla('TF_VentasPorCliente', [
      dto.idCliente,
      dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      dto.fechaFin ? new Date(dto.fechaFin) : null,
      dto.idCondicionPago ?? null,
      dto.idEstadoVenta ?? null,
    ]);
  }

  comprasPorProveedor(dto: ComprasPorProveedorDto) {
    return this.sql.consultarFuncionTabla('TF_ComprasPorProveedor', [
      dto.idProveedor,
      dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      dto.fechaFin ? new Date(dto.fechaFin) : null,
      dto.idEstadoCompra ?? null,
    ]);
  }

  cuentasVencidas(dto: CuentasVencidasDto) {
    return this.sql.consultarFuncionTabla('TF_CuentasVencidas', [
      dto.fechaCorte ? new Date(dto.fechaCorte) : null,
      dto.idCliente ?? null,
    ]);
  }

  facturasPendientes(dto: FacturasPendientesDto) {
    return this.sql.consultarFuncionTabla('TF_FacturasPendientes', [
      dto.idCliente ?? null,
      dto.fechaCorte ? new Date(dto.fechaCorte) : null,
      dto.idCondicionPago ?? null,
    ]);
  }

  movimientosInventario(dto: MovimientosInventarioReporteDto) {
    return this.sql.consultarFuncionTabla('TF_MovimientosInventario', [
      dto.idProducto ?? null,
      dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      dto.fechaFin ? new Date(dto.fechaFin) : null,
      dto.idTipoMovimiento ?? null,
    ]);
  }

  actividadUsuario(dto: ActividadUsuarioReporteDto) {
    return this.sql.consultarFuncionTabla('TF_ActividadUsuario', [
      dto.idUsuario,
      dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      dto.fechaFin ? new Date(dto.fechaFin) : null,
    ]);
  }
}
