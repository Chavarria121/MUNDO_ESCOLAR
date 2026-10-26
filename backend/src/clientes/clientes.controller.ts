import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { ClientesService } from './clientes.service';
import {
  ActualizarClienteDto,
  AutorizarCondicionPagoDto,
  ConsultarHistorialDto,
  CrearClienteInstitucionalDto,
  CrearClienteParticularDto,
} from './dto/clientes.dto';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar y buscar clientes (SP_Cliente_Consultar)' })
  @ApiQuery({ name: 'busqueda', required: false, description: 'Filtro por nombre, identificación o razón social' })
  consultar(@Query('busqueda') busqueda?: string) {
    return this.clientes.consultar(undefined, busqueda);
  }

  // Consulta pública a TSE / Hacienda de Costa Rica (disponible para Landing, POS y ERP)
  @Get('tse/:identificacion')
  @ApiOperation({ summary: 'Consultar datos de persona o empresa en TSE / Hacienda Costa Rica' })
  consultarTse(@Param('identificacion') identificacion: string) {
    return this.clientes.consultarTse(identificacion);
  }

  @Get('activos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Listar clientes activos con datos completos (VW_ClientesActivos)' })
  activos() {
    return this.clientes.listarClientesActivos();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar un cliente por su ID (SP_Cliente_Consultar)' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.clientes.consultarPorId(id);
  }

  @Get(':id/historial')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Historial de compras, facturas y saldos del cliente (SP_Cliente_HistorialOperaciones)' })
  historial(@Param('id', ParseIntPipe) id: number, @Query() dto: ConsultarHistorialDto) {
    return this.clientes.consultarHistorial(id, dto);
  }

  // Registro de cliente particular (Público desde Landing o colaboradores con sesión)
  @Post('particular')
  @ApiOperation({ summary: 'Registrar nuevo cliente particular (SP_Cliente_CrearPerfil)' })
  crearParticular(@Body() dto: CrearClienteParticularDto, @UsuarioActual() u?: UsuarioSesion) {
    return this.clientes.crearParticular(dto, u?.idUsuario ?? 1);
  }

  // Registro de cliente institucional (Público desde Landing o colaboradores con sesión)
  @Post('institucional')
  @ApiOperation({ summary: 'Registrar nuevo cliente institucional (SP_Cliente_CrearPerfil)' })
  crearInstitucional(@Body() dto: CrearClienteInstitucionalDto, @UsuarioActual() u?: UsuarioSesion) {
    return this.clientes.crearInstitucional(dto, u?.idUsuario ?? 1);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_GESTIONAR)
  @ApiOperation({ summary: 'Actualizar datos de cliente (SP_Cliente_Actualizar)' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClienteDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.clientes.actualizar(id, dto, u.idUsuario);
  }

  @Get(':id/condiciones-pago')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar condiciones de pago del cliente (SP_ClienteCondicionPago_Consultar)' })
  consultarCondicionesPago(@Param('id', ParseIntPipe) id: number) {
    return this.clientes.consultarCondicionesPago(id);
  }

  @Post(':id/condiciones-pago')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONDICIONES_PAGO)
  @ApiOperation({ summary: 'Autorizar condición de crédito al cliente (SP_ClienteCondicionPago_Autorizar)' })
  autorizarCondicionPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AutorizarCondicionPagoDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.clientes.autorizarCondicionPago(id, dto, u.idUsuario);
  }

  @Delete(':id/condiciones-pago/:idCondicion')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos(PERMISOS.CLIENTES_CONDICIONES_PAGO)
  @ApiOperation({ summary: 'Deshabilitar condición de crédito (SP_ClienteCondicionPago_Deshabilitar)' })
  deshabilitarCondicionPago(
    @Param('id', ParseIntPipe) id: number,
    @Param('idCondicion', ParseIntPipe) idCondicion: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.clientes.deshabilitarCondicionPago(id, idCondicion, u.idUsuario);
  }

  // Endpoints pblicos del Portal de Autoservicio para Clientes autenticados (RF1.5, RF1.11)
  @Get('portal/mi-perfil')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener el perfil e historial del cliente en sesin para el Portal de Clientes' })
  async miPerfil(@UsuarioActual() u: UsuarioSesion) {
    const perfil = await this.clientes.obtenerPerfilPorUsuario(u.idUsuario);
    if (!perfil) {
      return { esCliente: false, mensaje: 'El usuario no posee perfil de cliente asociado' };
    }
    const historial = await this.clientes.consultarHistorialPorUsuario(u.idUsuario);
    return {
      esCliente: true,
      perfil,
      historial,
    };
  }

  @Put('portal/mi-perfil')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar datos de contacto del cliente en sesin (RF1.5)' })
  async actualizarMiPerfil(@UsuarioActual() u: UsuarioSesion, @Body() dto: ActualizarClienteDto) {
    const perfil = await this.clientes.obtenerPerfilPorUsuario(u.idUsuario);
    if (!perfil) {
      return { exito: false, mensaje: 'No posee perfil de cliente' };
    }
    return this.clientes.actualizar(perfil.Id_Cliente, dto, u.idUsuario);
  }

}
