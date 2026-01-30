import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ExcelExporter } from './exporters/excel.exporter';
import { PdfExporter } from './exporters/pdf.exporter';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, ExcelExporter, PdfExporter],
  exports: [ReportsService, ExcelExporter, PdfExporter],
})
export class ReportsModule {}
