import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

// --- Insurance Provider DTOs ---

export class CreateInsuranceProviderDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  coverageDetails?: any;
}

export class UpdateInsuranceProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  coverageDetails?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Patient Insurance DTOs ---

export class CreatePatientInsuranceDto {
  @IsString()
  patientId: string;

  @IsString()
  insuranceProviderId: string;

  @IsString()
  policyNumber: string;

  @IsOptional()
  @IsString()
  groupNumber?: string;

  @IsOptional()
  @IsString()
  subscriberName?: string;

  @IsOptional()
  @IsIn(['SELF', 'SPOUSE', 'CHILD', 'OTHER'])
  subscriberRelation?: string;

  @IsOptional()
  @IsIn(['BASIC', 'PREMIUM', 'COMPLEMENTARY'])
  coverageType?: string;

  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  copayAmount?: number;

  @IsOptional()
  @IsNumber()
  coinsurancePercent?: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsOptional()
  @IsNumber()
  maxAnnualBenefit?: number;
}

export class UpdatePatientInsuranceDto {
  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsString()
  groupNumber?: string;

  @IsOptional()
  @IsString()
  subscriberName?: string;

  @IsOptional()
  @IsIn(['SELF', 'SPOUSE', 'CHILD', 'OTHER'])
  subscriberRelation?: string;

  @IsOptional()
  @IsIn(['BASIC', 'PREMIUM', 'COMPLEMENTARY'])
  coverageType?: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  copayAmount?: number;

  @IsOptional()
  @IsNumber()
  coinsurancePercent?: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsOptional()
  @IsNumber()
  maxAnnualBenefit?: number;
}

export class VerifyInsuranceDto {
  @IsIn(['VERIFIED', 'REJECTED', 'EXPIRED'])
  verificationStatus: string;

  @IsOptional()
  @IsString()
  verificationNotes?: string;
}
