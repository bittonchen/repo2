import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { UploadModule } from './modules/upload/upload.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SearchModule } from './modules/search/search.module';
import { TreatmentTemplatesModule } from './modules/treatment-templates/treatment-templates.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { BookingModule } from './modules/booking/booking.module';
import { LabModule } from './modules/lab/lab.module';
import { ImagingModule } from './modules/imaging/imaging.module';
import { AuditModule } from './modules/audit/audit.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),
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
    UploadModule,
    PaymentModule,
    SearchModule,
    TreatmentTemplatesModule,
    MedicalRecordsModule,
    BookingModule,
    LabModule,
    ImagingModule,
    AuditModule,
    PrivacyModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
