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
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientes: ClientesService) {}

  @Get()
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar y buscar clientes (SP_Cliente_Consultar)' })
  @ApiQuery({ name: 'busqueda', required: false, description: 'Filtro por nombre, identificación o razón social' })
  consultar(@Query('busqueda') busqueda?: string) {
    return this.clientes.consultar(undefined, busqueda);
  }

  
  @Get('tse/:identificacion')
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar datos de persona o empresa en TSE / Hacienda Costa Rica' })
  consultarTse(@Param('identificacion') identificacion: string) {
    return this.clientes.consultarTse(identificacion);
  }

  @Get('activos')
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Listar clientes activos con datos completos (VW_ClientesActivos)' })
  activos() {
    return this.clientes.listarClientesActivos();
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar un cliente por su ID (SP_Cliente_Consultar)' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.clientes.consultarPorId(id);
  }

  @Get(':id/historial')
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Historial de compras, facturas y saldos del cliente (SP_Cliente_HistorialOperaciones)' })
  historial(@Param('id', ParseIntPipe) id: number, @Query() dto: ConsultarHistorialDto) {
    return this.clientes.consultarHistorial(id, dto);
  }

  @Post('particular')
  @RequierePermisos(PERMISOS.CLIENTES_GESTIONAR)
  @ApiOperation({ summary: 'Registrar nuevo cliente particular (SP_Cliente_CrearPerfil)' })
  crearParticular(@Body() dto: CrearClienteParticularDto, @UsuarioActual() u: UsuarioSesion) {
    return this.clientes.crearParticular(dto, u.idUsuario);
  }

  @Post('institucional')
  @RequierePermisos(PERMISOS.CLIENTES_GESTIONAR)
  @ApiOperation({ summary: 'Registrar nuevo cliente institucional (SP_Cliente_CrearPerfil)' })
  crearInstitucional(@Body() dto: CrearClienteInstitucionalDto, @UsuarioActual() u: UsuarioSesion) {
    return this.clientes.crearInstitucional(dto, u.idUsuario);
  }

  @Put(':id')
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
  @RequierePermisos(PERMISOS.CLIENTES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar condiciones de pago del cliente (SP_ClienteCondicionPago_Consultar)' })
  consultarCondicionesPago(@Param('id', ParseIntPipe) id: number) {
    return this.clientes.consultarCondicionesPago(id);
  }

  @Post(':id/condiciones-pago')
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
  @RequierePermisos(PERMISOS.CLIENTES_CONDICIONES_PAGO)
  @ApiOperation({ summary: 'Deshabilitar condición de crédito (SP_ClienteCondicionPago_Deshabilitar)' })
  deshabilitarCondicionPago(
    @Param('id', ParseIntPipe) id: number,
    @Param('idCondicion', ParseIntPipe) idCondicion: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.clientes.deshabilitarCondicionPago(id, idCondicion, u.idUsuario);
  }
}
