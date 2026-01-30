import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe functionality will be limited');
    }
    this.stripe = new Stripe(stripeSecretKey || '');
  }

  /**
   * Creates or retrieves a Stripe customer for a tenant
   */
  async getOrCreateCustomer(tenantId: string): Promise<Stripe.Customer> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // If tenant already has a Stripe customer, retrieve it
    if (tenant.stripeCustomerId) {
      try {
        const customer = await this.stripe.customers.retrieve(tenant.stripeCustomerId);
        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      } catch (error) {
        this.logger.warn(`Could not retrieve Stripe customer ${tenant.stripeCustomerId}`, error);
      }
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email: tenant.owner.email,
      name: tenant.name,
      metadata: {
        tenantId: tenant.id,
        ownerId: tenant.ownerId,
      },
    });

    // Save customer ID to tenant
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(`Created Stripe customer ${customer.id} for tenant ${tenantId}`);
    return customer;
  }

  /**
   * Creates a checkout session for subscription
   */
  async createCheckoutSession(
    tenantId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    const customer = await this.getOrCreateCustomer(tenantId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
      },
      subscription_data: {
        metadata: {
          tenantId,
        },
      },
    });

    this.logger.log(`Created checkout session ${session.id} for tenant ${tenantId}`);
    return session;
  }

  /**
   * Creates a portal session for subscription management
   */
  async createPortalSession(tenantId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.stripeCustomerId) {
      throw new BadRequestException('Tenant does not have a Stripe customer');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: returnUrl,
    });

    return session;
  }

  /**
   * Handles Stripe webhook events
   */
  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const tenantId = session.metadata?.tenantId;
    if (!tenantId) return;

    this.logger.log(`Checkout completed for tenant ${tenantId}`);

    // The subscription will be handled by the subscription.created event
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    const status = this.mapStripeStatus(subscription.status);
    const tier = this.mapStripePriceToTier(subscription.items.data[0]?.price?.id);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: status,
        subscriptionTier: tier,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });

    this.logger.log(`Updated subscription for tenant ${tenantId}: ${status}, ${tier}`);
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) return;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionStatus: 'CANCELLED',
      },
    });

    this.logger.log(`Subscription cancelled for tenant ${tenantId}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);
    // Could send email notification here
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const tenant = await this.prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (tenant) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: 'PAST_DUE' },
      });
      this.logger.warn(`Payment failed for tenant ${tenant.id}`);
    }
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' {
    switch (status) {
      case 'trialing':
        return 'TRIAL';
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':
        return 'CANCELLED';
      default:
        return 'ACTIVE';
    }
  }

  private mapStripePriceToTier(priceId: string | undefined): 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' {
    const starterPrice = this.configService.get('STRIPE_PRICE_STARTER');
    const proPrice = this.configService.get('STRIPE_PRICE_PROFESSIONAL');
    const enterprisePrice = this.configService.get('STRIPE_PRICE_ENTERPRISE');

    if (priceId === enterprisePrice) return 'ENTERPRISE';
    if (priceId === proPrice) return 'PROFESSIONAL';
    return 'STARTER';
  }

  /**
   * Gets subscription details for a tenant
   */
  async getSubscription(tenantId: string): Promise<Stripe.Subscription | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant?.stripeCustomerId) return null;

    const subscriptions = await this.stripe.subscriptions.list({
      customer: tenant.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    return subscriptions.data[0] || null;
  }

  /**
   * Gets available subscription plans from Stripe
   */
  async getPlans(): Promise<Stripe.Price[]> {
    const prices = await this.stripe.prices.list({
      active: true,
      type: 'recurring',
      expand: ['data.product'],
    });

    return prices.data;
  }
}
