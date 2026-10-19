import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SeguridadService } from './seguridad.service';
import { UsuariosController } from './usuarios.controller';
import { RolesController } from './roles.controller';
import { PermisosController } from './permisos.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsuariosController, RolesController, PermisosController],
  providers: [SeguridadService],
})
export class SeguridadModule {}
