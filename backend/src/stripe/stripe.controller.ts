import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('stripe')
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a checkout session for subscription' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async createCheckout(@Request() req, @Body() dto: CreateCheckoutDto) {
    const session = await this.stripeService.createCheckoutSession(
      req.user.tenantId,
      dto.priceId,
      dto.successUrl,
      dto.cancelUrl,
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a billing portal session' })
  @ApiResponse({ status: 200, description: 'Portal session created' })
  async createPortal(@Request() req, @Body('returnUrl') returnUrl: string) {
    const session = await this.stripeService.createPortalSession(
      req.user.tenantId,
      returnUrl,
    );

    return {
      url: session.url,
    };
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  async getSubscription(@Request() req) {
    const subscription = await this.stripeService.getSubscription(req.user.tenantId);
    return { subscription };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'Available plans' })
  async getPlans() {
    const plans = await this.stripeService.getPlans();
    return { plans };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.stripeService.handleWebhook(signature, req.rawBody);
    return { received: true };
  }
}
