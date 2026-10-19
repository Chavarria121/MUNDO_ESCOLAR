import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { hashContrasena } from '../auth/password.util';
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto/catalogos.dto';

@Injectable()
export class CatalogosService {
  constructor(private readonly sql: SqlService) {}

  listarTiposCliente() {
    return this.sql.consultarVista('VW_TiposClienteActivos');
  }

  listarCondicionesPago() {
    return this.sql.consultarVista('VW_CondicionesPagoActivas');
  }

  listarMetodosPago() {
    return this.sql.consultarVista('VW_MetodosPagoActivos');
  }

  listarCategorias() {
    return this.sql.consultarVista('VW_CategoriasActivas');
  }

  crearCategoria(dto: CrearCategoriaDto, idUsuario: number) {
    return this.sql.consultarSPUno(
      'SP_Categoria_Crear',
      { Nombre: dto.nombre, Descripcion: dto.descripcion ?? null },
      { idUsuario },
    );
  }

  actualizarCategoria(id: number, dto: ActualizarCategoriaDto, idUsuario: number) {
    return this.sql.consultarSPUno(
      'SP_Categoria_Actualizar',
      { Id_Categoria: id, Nombre: dto.nombre, Descripcion: dto.descripcion ?? null, Estado: dto.estado },
      { idUsuario },
    );
  }
}
