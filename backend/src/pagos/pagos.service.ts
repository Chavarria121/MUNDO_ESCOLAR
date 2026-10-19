import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { AnularPagoDto, RegistrarPagoDto } from './dto/pagos.dto';

@Injectable()
export class PagosService {
  constructor(private readonly sql: SqlService) {}

  listarPagosVista() {
    return this.sql.consultarVista('VW_Pagos');
  }

  async consultarPagosFactura(idFactura: number) {
    const todos = await this.sql.consultarVista('VW_Pagos');
    return todos.filter((p: any) => p.Id_Factura === idFactura);
  }

  async registrarPago(dto: RegistrarPagoDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Pago_Registrar',
      {
        Id_Factura: dto.idFactura,
        Id_Metodo_Pago: dto.idMetodoPago,
        Monto_Pagado: dto.montoPagado,
        Numero_Referencia: dto.numeroReferencia ?? null,
      },
      { idUsuario, salidas: { Id_Pago_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Pago: r.salida.Id_Pago_Nuevo };
  }

  async anularPago(idPago: number, dto: AnularPagoDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Pago_Anular',
      {
        Id_Pago: idPago,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Pago anulado y saldo restituido a la factura con éxito.' };
  }
}
