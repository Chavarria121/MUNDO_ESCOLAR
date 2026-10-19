import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { AnularFacturaDto, ConsultarFacturasDto, GenerarFacturaDto } from './dto/facturacion.dto';

@Injectable()
export class FacturacionService {
  constructor(private readonly sql: SqlService) {}

  listarFacturasVista() {
    return this.sql.consultarVista('VW_Facturas');
  }

  consultar(dto: ConsultarFacturasDto) {
    return this.sql.consultarSP('SP_Factura_Consultar', {
      Id_Factura: dto.idFactura ?? null,
      Id_Venta: dto.idVenta ?? null,
      Id_Cliente: dto.idCliente ?? null,
      Id_Estado_Factura: dto.idEstadoFactura ?? null,
    });
  }

  async consultarPorId(id: number) {
    const list = await this.consultar({ idFactura: id });
    return list[0] ?? null;
  }

  async generarFactura(dto: GenerarFacturaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Factura_Generar',
      { Id_Venta: dto.idVenta },
      { idUsuario, salidas: { Id_Factura_Nueva: 'int' } },
    );
    return r.filas[0] ?? { Id_Factura: r.salida.Id_Factura_Nueva };
  }

  async anularFactura(idFactura: number, dto: AnularFacturaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Factura_Anular',
      {
        Id_Factura: idFactura,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Factura anulada con éxito.' };
  }
}
