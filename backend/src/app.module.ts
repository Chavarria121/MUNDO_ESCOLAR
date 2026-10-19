import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { SeguridadModule } from './seguridad/seguridad.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ProductosModule } from './productos/productos.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { InventarioModule } from './inventario/inventario.module';
import { ComprasModule } from './compras/compras.module';
import { VentasModule } from './ventas/ventas.module';
import { FacturacionModule } from './facturacion/facturacion.module';
import { PagosModule } from './pagos/pagos.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { BiModule } from './bi/bi.module';
import { ReportesModule } from './reportes/reportes.module';
import { DbaModule } from './dba/dba.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    AuthModule,
    SeguridadModule,
    CatalogosModule,
    ClientesModule,
    ProductosModule,
    ProveedoresModule,
    InventarioModule,
    ComprasModule,
    VentasModule,
    FacturacionModule,
    PagosModule,
    AuditoriaModule,
    BiModule,
    ReportesModule,
    DbaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
