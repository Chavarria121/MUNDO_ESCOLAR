import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsuarioActual } from './decorators/usuario-actual.decorator';
import { type UsuarioSesion } from './interfaces/usuario-sesion.interface';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión (SP_Usuario_ObtenerParaAutenticacion + SP_Permiso_ConsultarUsuario)' })
  @ApiResponse({ status: 200, description: 'Token JWT, datos del usuario y permisos efectivos.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  @ApiResponse({ status: 403, description: 'Usuario inactivo.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.nombreUsuario, dto.contrasena);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario autenticado y sus permisos vigentes (leídos de SQL Server)' })
  perfil(@UsuarioActual() usuario: UsuarioSesion) {
    return usuario;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias para obtener el perfil del usuario actual' })
  me(@UsuarioActual() usuario: UsuarioSesion) {
    return usuario;
  }

  @Post('cambiar-contrasena')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permite al usuario autenticado cambiar su contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'La nueva contraseña debe ser diferente o no cumple requisitos.' })
  @ApiResponse({ status: 401, description: 'Contraseña actual incorrecta.' })
  cambiarContrasena(@UsuarioActual() usuario: UsuarioSesion, @Body() dto: CambiarContrasenaDto) {
    return this.authService.cambiarContrasena(usuario.idUsuario, dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cierre de sesión seguro' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente.' })
  logout() {
    return { mensaje: 'Sesión cerrada exitosamente.' };
  }
}
