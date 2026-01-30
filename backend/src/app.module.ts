import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClinicsModule } from './clinics/clinics.module';
import { TenantMembershipModule } from './tenant-membership/tenant-membership.module';
import { RecurringAppointmentsModule } from './recurring-appointments/recurring-appointments.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TreatmentPlansModule } from './treatment-plans/treatment-plans.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentsModule } from './documents/documents.module';
import { OdontogramsModule } from './odontograms/odontograms.module';
import { EmailModule } from './email/email.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CaslModule } from './casl/casl.module';
import { PublicModule } from './public/public.module';
import { StripeModule } from './stripe/stripe.module';
import { CalendarSyncModule } from './calendar-sync/calendar-sync.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6381,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    ClinicsModule,
    TenantMembershipModule,
    RecurringAppointmentsModule,
    WaitlistModule,
    AdminModule,
    NotificationsModule,
    TreatmentPlansModule,
    InvoicesModule,
    PaymentsModule,
    DocumentsModule,
    OdontogramsModule,
    EmailModule,
    WhatsappModule,
    CaslModule,
    PublicModule,
    StripeModule,
    CalendarSyncModule,
    ChatbotModule,
    ReportsModule,
  ],
})
export class AppModule { }
