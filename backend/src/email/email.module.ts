import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailConfigService } from './email-config.service';
import { EmailTemplateService } from './email-template.service';
import { EmailController } from './email.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, AdminModule],
  controllers: [EmailController],
  providers: [EmailService, EmailConfigService, EmailTemplateService],
  exports: [EmailService, EmailConfigService, EmailTemplateService],
})
export class EmailModule {}
