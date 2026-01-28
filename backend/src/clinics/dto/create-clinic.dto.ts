import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsObject } from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({ description: 'Clinic name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Clinic address',
    example: { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'USA' }
  })
  @IsObject()
  @IsNotEmpty()
  address: any;

  @ApiProperty({ description: 'Clinic phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Clinic email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
