// functions/src/billing.ts
// Stripe webhook integration and commission processing

import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

// Initialize Stripe (you'll need to set this in environment config)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...', {
  apiVersion: '2025-08-27.basil'
});

const db = getFirestore();

/**
 * Create Stripe checkout session for organization deployment
 */
export const createCheckoutSession = onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    try {
      const {
        organizationId,
        planTier,
        customerEmail,
        customerName,
        resellerId,
        successUrl,
        cancelUrl
      } = req.body;

      logger.info('Creating Stripe checkout session', { organizationId, planTier });

      // Get plan pricing from our config
      const planPricing = {
        starter: { price: 29900, name: 'Starter Plan - Up to 10 employees' },
        professional: { price: 49900, name: 'Professional Plan - Up to 50 employees' },
        enterprise: { price: 79900, name: 'Enterprise Plan - Up to 200 employees' },
        'enterprise-plus': { price: 129900, name: 'Enterprise Plus - Unlimited employees' }
      };

      const plan = planPricing[planTier as keyof typeof planPricing];
      if (!plan) {
        res.status(400).json({ error: 'Invalid plan tier' });
        return;
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: customerEmail,
        
        line_items: [{
          price_data: {
            currency: 'zar',
            product_data: {
              name: plan.name,
              description: `HR Disciplinary System for ${customerName}`
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }],

        metadata: {
          organizationId,
          planTier,
          resellerId: resellerId || '',
          customerName
        },

        subscription_data: {
          metadata: {
            organizationId,
            planTier,
            resellerId: resellerId || ''
          }
        },

        success_url: successUrl,
        cancel_url: cancelUrl
      });

      logger.info('Stripe checkout session created', { sessionId: session.id });

      res.json({
        sessionId: session.id,
        url: session.url
      });

    } catch (error) {
      logger.error('Failed to create checkout session', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
);

/**
 * Handle Stripe webhooks for payment processing
 */
export const stripeWebhook = onRequest(
  { cors: true },
  async (req, res): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';

    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      logger.info('Stripe webhook received', { type: event.type });

      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
          
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
          
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;
          
        default:
          logger.info(`Unhandled webhook type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      logger.error('Stripe webhook error', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  }
);

/**
 * Handle successful checkout - activate organization (Sharded Architecture Compatible)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const { organizationId, planTier, resellerId } = session.metadata || {};
    
    if (!organizationId) {
      logger.error('No organizationId in checkout session metadata');
      return;
    }

    logger.info('Activating sharded organization after successful payment', { organizationId });

    // Update organization status in main collection
    await db.collection('organizations').doc(organizationId).update({
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      isActive: true,
      activatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Ensure sharding metadata is preserved
      databaseVersion: '2.0',
      shardingEnabled: true,
      dataStructure: 'sharded'
    });

    // Create subscription record
    await db.collection('subscriptions').doc(`sub_${organizationId}`).set({
      id: `sub_${organizationId}`,
      organizationId,
      planTier,
      status: 'active',
      stripeSubscriptionId: session.subscription,
      stripeCustomerId: session.customer,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Activate admin users in sharded structure
    const usersQuery = await db.collection(`organizations/${organizationId}/users`)
      .where('role', '==', 'business-owner')
      .limit(1)
      .get();

    if (!usersQuery.empty) {
      const adminUserDoc = usersQuery.docs[0];
      await adminUserDoc.ref.update({
        isActive: true,
        activatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      logger.info('Admin user activated in sharded structure', { 
        adminUserId: adminUserDoc.id, 
        organizationId 
      });
    } else {
      logger.warn('No admin user found for organization', { organizationId });
    }

    // Update reseller client count if assigned
    if (resellerId) {
      const resellerRef = db.collection('resellers').doc(resellerId);
      const resellerDoc = await resellerRef.get();
      
      if (resellerDoc.exists) {
        const currentClientIds = resellerDoc.data()?.clientIds || [];
        await resellerRef.update({
          clientIds: [...currentClientIds, organizationId],
          totalClientsAcquired: (resellerDoc.data()?.totalClientsAcquired || 0) + 1,
          updatedAt: new Date().toISOString()
        });
      }
    }

    logger.info('Organization activated successfully', { organizationId });

  } catch (error) {
    logger.error('Failed to handle checkout completion', error);
  }
}

/**
 * Handle successful monthly payment - calculate commissions
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!(invoice as any).subscription) return;

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const { organizationId, resellerId } = subscription.metadata || {};

    if (!organizationId) {
      logger.error('No organizationId in subscription metadata');
      return;
    }

    const grossAmount = invoice.amount_paid; // Amount in cents
    const stripeFees = Math.round(grossAmount * 0.029); // Approximate 2.9% Stripe fee
    const netRevenue = grossAmount - stripeFees;

    // Calculate revenue split (50% reseller, 30% owner, 20% company)
    const commissionAmount = Math.round(netRevenue * 0.50);
    const ownerAmount = Math.round(netRevenue * 0.30);
    const companyAmount = Math.round(netRevenue * 0.20);

    logger.info('Calculating commission for payment', {
      organizationId,
      resellerId,
      grossAmount,
      netRevenue,
      commissionAmount
    });

    // Create commission record
    const commissionId = `${organizationId}-${invoice.created}`;
    await db.collection('commissions').doc(commissionId).set({
      id: commissionId,
      resellerId: resellerId || '',
      organizationId,
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      
      periodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
      periodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
      
      clientRevenue: grossAmount,
      stripeFees: stripeFees,
      netRevenue: netRevenue,
      commissionAmount: commissionAmount,
      ownerAmount: ownerAmount,
      companyAmount: companyAmount,
      
      status: 'calculated', // Will become 'pending' after 30 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update reseller MRR
    if (resellerId) {
      const resellerRef = db.collection('resellers').doc(resellerId);
      await resellerRef.update({
        monthlyRecurringRevenue: netRevenue, // This should be calculated more precisely
        totalCommissionsEarned: (await resellerRef.get()).data()?.totalCommissionsEarned + commissionAmount || commissionAmount,
        updatedAt: new Date().toISOString()
      });
    }

    logger.info('Commission calculated and recorded', { commissionId });

  } catch (error) {
    logger.error('Failed to handle payment succeeded', error);
  }
}

/**
 * Handle subscription updates (tier changes)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { organizationId } = subscription.metadata || {};
    
    if (!organizationId) return;

    logger.info('Updating subscription', { organizationId, status: subscription.status });

    // Update subscription record
    await db.collection('subscriptions').doc(`sub_${organizationId}`).update({
      status: subscription.status,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update organization subscription status
    await db.collection('organizations').doc(organizationId).update({
      subscriptionStatus: subscription.status,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to handle subscription update', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const { organizationId } = subscription.metadata || {};
    
    if (!organizationId) return;

    logger.info('Canceling subscription', { organizationId });

    // Update subscription record
    await db.collection('subscriptions').doc(`sub_${organizationId}`).update({
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Deactivate organization
    await db.collection('organizations').doc(organizationId).update({
      subscriptionStatus: 'canceled',
      isActive: false,
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to handle subscription cancellation', error);
  }
}

/**
 * Scheduled function to process monthly commission payouts
 * Runs daily at 2 AM UTC
 */
export const processMonthlyCommissions = onSchedule(
  {
    schedule: '0 2 * * *', // Daily at 2 AM UTC
    timeZone: 'UTC'
  },
  async () => {
    try {
      logger.info('Starting monthly commission processing...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get commissions older than 30 days that are still 'calculated'
      const commissionsQuery = db.collection('commissions')
        .where('status', '==', 'calculated')
        .where('createdAt', '<', thirtyDaysAgo.toISOString());

      const snapshot = await commissionsQuery.get();
      
      if (snapshot.empty) {
        logger.info('No commissions ready for payout');
        return;
      }

      logger.info(`Processing ${snapshot.size} commissions for payout`);

      // Group by reseller and month
      const commissionsByResellerMonth: { [key: string]: any[] } = {};

      snapshot.docs.forEach(doc => {
        const commission = doc.data();
        const month = commission.periodStart.slice(0, 7); // YYYY-MM
        const key = `${commission.resellerId}|${month}`;
        
        if (!commissionsByResellerMonth[key]) {
          commissionsByResellerMonth[key] = [];
        }
        
        commissionsByResellerMonth[key].push({ id: doc.id, ...commission });
      });

      // Create commission reports for each reseller/month
      for (const [resellerMonth, commissions] of Object.entries(commissionsByResellerMonth)) {
        const [resellerId, month] = resellerMonth.split('|');
        
        // Get reseller details
        const resellerDoc = await db.collection('resellers').doc(resellerId).get();
        const reseller = resellerDoc.data();
        
        if (!reseller) continue;

        const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalRevenue = commissions.reduce((sum, c) => sum + c.netRevenue, 0);

        const reportId = `${resellerId}-${month}`;
        
        // Create commission report
        await db.collection('commissionReports').doc(reportId).set({
          id: reportId,
          resellerId,
          resellerName: `${reseller.firstName} ${reseller.lastName}`,
          month,
          province: reseller.province,
          
          totalClients: commissions.length,
          totalRevenue,
          totalCommission,
          
          commissions: commissions.map(c => c.id),
          
          payoutStatus: 'pending',
          payoutDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Update individual commissions to 'pending' status
        const batch = db.batch();
        commissions.forEach(commission => {
          batch.update(db.collection('commissions').doc(commission.id), {
            status: 'pending',
            updatedAt: new Date().toISOString()
          });
        });
        await batch.commit();

        logger.info(`Created commission report for ${reseller.firstName} ${reseller.lastName}: R${(totalCommission / 100).toFixed(2)}`);
      }

      logger.info('Monthly commission processing completed');

    } catch (error) {
      logger.error('Failed to process monthly commissions', error);
    }
  }
);

/**
 * Create customer portal session for subscription management
 */
export const createPortalSession = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const { customerId, returnUrl } = req.body;

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      res.json({ url: session.url });

    } catch (error) {
      logger.error('Failed to create portal session', error);
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  }
);