import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ClientsModule } from './modules/clients/clients.module';
import { AnimalsModule } from './modules/animals/animals.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { PosModule } from './modules/pos/pos.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AdminModule } from './modules/admin/admin.module';
import { PlansModule } from './modules/plans/plans.module';

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
    EmployeesModule,
    MessagingModule,
    RemindersModule,
    PosModule,
    QuotesModule,
    FinanceModule,
    AdminModule,
    PlansModule,
  ],
})
export class AppModule {}
