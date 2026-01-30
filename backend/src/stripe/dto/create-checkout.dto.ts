import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ description: 'Stripe Price ID for the subscription plan' })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiProperty({ description: 'URL to redirect after successful checkout' })
  @IsUrl()
  @IsNotEmpty()
  successUrl: string;

  @ApiProperty({ description: 'URL to redirect if checkout is cancelled' })
  @IsUrl()
  @IsNotEmpty()
  cancelUrl: string;
}
