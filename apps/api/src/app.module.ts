import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AnimalsModule } from './modules/animals/animals.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    ClientsModule,
    AnimalsModule,
    AppointmentsModule,
    InventoryModule,
  ],
})
export class AppModule {}
