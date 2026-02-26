import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { ServicesModule } from './services/services.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { MedicalExamsModule } from './medical-exams/medical-exams.module';
import { ConsentsModule } from './consents/consents.module';
import { ClinicAdminModule } from './clinic-admin/clinic-admin.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { StaffManagementModule } from './staff-management/staff-management.module';
import { SharedDocumentsModule } from './shared-documents/shared-documents.module';
import { ModulesModule } from './modules/modules.module';
import { GeneralMedicineModule } from './modules/general-medicine/general-medicine.module';
import { PsychologyModule } from './modules/psychology/psychology.module';
import { PhysiotherapyModule } from './modules/physiotherapy/physiotherapy.module';
import { DermatologyModule } from './modules/dermatology/dermatology.module';
import { OphthalmologyModule } from './modules/ophthalmology/ophthalmology.module';
import { CardiologyModule } from './modules/cardiology/cardiology.module';
import { PediatricsModule } from './modules/pediatrics/pediatrics.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { GynecologyModule } from './modules/gynecology/gynecology.module';
import { InventoryModule } from './inventory/inventory.module';
import { InsuranceModule } from './insurance/insurance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60_000,
      limit: 20,
    }]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6381,
        password: process.env.REDIS_PASSWORD || undefined,
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
    ServicesModule,
    SubscriptionModule,
    MedicalExamsModule,
    ConsentsModule,
    ClinicAdminModule,
    SchedulingModule,
    StaffManagementModule,
    SharedDocumentsModule,
    ModulesModule,
    GeneralMedicineModule,
    PsychologyModule,
    PhysiotherapyModule,
    DermatologyModule,
    OphthalmologyModule,
    CardiologyModule,
    PediatricsModule,
    NutritionModule,
    GynecologyModule,
    InventoryModule,
    InsuranceModule,
  ],
})
export class AppModule { }
