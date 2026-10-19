import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  AjusteInventarioDto,
  ConsultarMovimientosDto,
  EntradaInventarioDto,
  RevertirMovimientoDto,
  SalidaInventarioDto,
} from './dto/inventario.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly sql: SqlService) {}

  listarMovimientosVista() {
    return this.sql.consultarVista('VW_MovimientosInventario');
  }

  consultarMovimientos(dto: ConsultarMovimientosDto) {
    return this.sql.consultarSP('SP_Inventario_ConsultarMovimientos', {
      Id_Producto: dto.idProducto ?? null,
      FechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      FechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      Id_Tipo_Movimiento: dto.idTipoMovimiento ?? null,
    });
  }

  consultarBajoReorden() {
    return this.sql.consultarSP('SP_Inventario_ProductosBajoReorden');
  }

  async registrarEntrada(dto: EntradaInventarioDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Inventario_Entrada',
      {
        Id_Producto: dto.idProducto,
        Cantidad: dto.cantidad,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Entrada registrada con éxito.' };
  }

  async registrarSalida(dto: SalidaInventarioDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Inventario_Salida',
      {
        Id_Producto: dto.idProducto,
        Cantidad: dto.cantidad,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Salida registrada con éxito.' };
  }

  async registrarAjuste(dto: AjusteInventarioDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Inventario_Ajustar',
      {
        Id_Producto: dto.idProducto,
        StockFisicoReal: dto.stockFisicoReal,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Ajuste procesado con éxito.' };
  }

  async revertirMovimiento(idMovimiento: number, dto: RevertirMovimientoDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Inventario_RevertirMovimiento',
      {
        Id_Movimiento_Inventario: idMovimiento,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Movimiento revertido con éxito.' };
  }
}
