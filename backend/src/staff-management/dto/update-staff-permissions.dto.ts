import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PatientPermissions {
  @ApiProperty() @IsBoolean() view: boolean;
  @ApiProperty() @IsBoolean() create: boolean;
  @ApiProperty() @IsBoolean() edit: boolean;
  @ApiProperty() @IsBoolean() delete: boolean;
}

export class AppointmentPermissions {
  @ApiProperty() @IsBoolean() view: boolean;
  @ApiProperty() @IsBoolean() create: boolean;
  @ApiProperty() @IsBoolean() edit: boolean;
  @ApiProperty() @IsBoolean() cancel: boolean;
}

export class BillingPermissions {
  @ApiProperty() @IsBoolean() view: boolean;
  @ApiProperty() @IsBoolean() create: boolean;
}

export class ClinicalPermissions {
  @ApiProperty() @IsBoolean() viewNotes: boolean;
  @ApiProperty() @IsBoolean() viewDocuments: boolean;
}

export class UpdateStaffPermissionsDto {
  @ApiProperty({ type: PatientPermissions, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientPermissions)
  patients?: PatientPermissions;

  @ApiProperty({ type: AppointmentPermissions, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentPermissions)
  appointments?: AppointmentPermissions;

  @ApiProperty({ type: BillingPermissions, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingPermissions)
  billing?: BillingPermissions;

  @ApiProperty({ type: ClinicalPermissions, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClinicalPermissions)
  clinical?: ClinicalPermissions;
}
