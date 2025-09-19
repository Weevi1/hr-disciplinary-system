// frontend/src/services/StripeService.ts
// Stripe integration for subscription billing

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Logger from '../utils/logger';
import type { 
  SubscriptionTier, 
  SubscriptionPlan, 
  Subscription,
  SUBSCRIPTION_PLANS 
} from '../types/billing';

// Initialize Stripe with development mode handling
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const isDevelopment = !stripeKey || stripeKey === 'pk_test_...' || stripeKey.startsWith('pk_test_placeholder');
const stripePromise = isDevelopment ? Promise.resolve(null) : loadStripe(stripeKey);

class StripeService {
  private stripe: Promise<Stripe | null> = stripePromise;
  private functions = getFunctions();
  private isDevelopment = isDevelopment;

  /**
   * Create a new subscription for an organization
   */
  async createSubscription(params: {
    organizationId: string;
    planTier: SubscriptionTier;
    customerEmail: string;
    customerName: string;
    resellerId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    try {
      Logger.debug('Creating Stripe subscription...', params);

      // Development mode - return mock data
      if (this.isDevelopment) {
        Logger.warn('Development mode: Returning mock Stripe session');
        return {
          sessionId: `cs_dev_${Date.now()}`,
          url: `${window.location.origin}/mock-checkout?plan=${params.planTier}&org=${params.organizationId}`
        };
      }

      const createCheckoutSession = httpsCallable(this.functions, 'createCheckoutSession');
      
      const result = await createCheckoutSession({
        organizationId: params.organizationId,
        planTier: params.planTier,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        resellerId: params.resellerId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl
      });

      const data = result.data as { sessionId: string; url: string };
      
      Logger.success('Stripe checkout session created:', data);
      return data;

    } catch (error) {
      Logger.error('Failed to create Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription when organization adds employees
   */
  async updateSubscriptionTier(
    subscriptionId: string, 
    newTier: SubscriptionTier,
    employeeCount: number
  ): Promise<Subscription> {
    try {
      Logger.debug('Updating subscription tier...', { subscriptionId, newTier, employeeCount });

      const updateSubscription = httpsCallable(this.functions, 'updateSubscription');
      
      const result = await updateSubscription({
        subscriptionId,
        newTier,
        employeeCount
      });

      const subscription = result.data as Subscription;
      
      Logger.success('Subscription updated:', subscription);
      return subscription;

    } catch (error) {
      Logger.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription 
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription> {
    try {
      Logger.debug('Canceling subscription...', { subscriptionId, reason });

      const cancelSubscription = httpsCallable(this.functions, 'cancelSubscription');
      
      const result = await cancelSubscription({
        subscriptionId,
        reason
      });

      const subscription = result.data as Subscription;
      
      Logger.success('Subscription canceled:', subscription);
      return subscription;

    } catch (error) {
      Logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Determine appropriate subscription tier based on employee count
   */
  getRecommendedTier(employeeCount: number): SubscriptionTier {
    if (employeeCount <= 10) return 'starter';
    if (employeeCount <= 50) return 'professional';  
    if (employeeCount <= 200) return 'enterprise';
    return 'enterprise-plus';
  }

  /**
   * Check if organization needs to upgrade based on employee count
   */
  needsUpgrade(currentTier: SubscriptionTier, employeeCount: number): {
    needsUpgrade: boolean;
    recommendedTier?: SubscriptionTier;
    exceedsLimit: boolean;
  } {
    const currentPlan = SUBSCRIPTION_PLANS[currentTier];
    const recommendedTier = this.getRecommendedTier(employeeCount);
    
    return {
      needsUpgrade: currentTier !== recommendedTier,
      recommendedTier: currentTier !== recommendedTier ? recommendedTier : undefined,
      exceedsLimit: employeeCount > currentPlan.employeeLimit
    };
  }

  /**
   * Calculate prorated amount for mid-cycle upgrades
   */
  calculateProratedUpgrade(
    currentTier: SubscriptionTier,
    newTier: SubscriptionTier,
    daysRemaining: number
  ): number {
    const currentPlan = SUBSCRIPTION_PLANS[currentTier];
    const newPlan = SUBSCRIPTION_PLANS[newTier];
    
    const priceDifference = newPlan.price - currentPlan.price;
    const dailyRate = priceDifference / 30; // Monthly billing
    
    return Math.round(dailyRate * daysRemaining);
  }

  /**
   * Create customer portal session for subscription management
   */
  async createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    try {
      Logger.debug('Creating customer portal session...', { customerId });

      // Development mode - return mock portal URL
      if (this.isDevelopment) {
        Logger.warn('Development mode: Returning mock customer portal URL');
        return {
          url: `${window.location.origin}/mock-portal?customer=${customerId}&return=${encodeURIComponent(returnUrl)}`
        };
      }

      const createPortalSession = httpsCallable(this.functions, 'createPortalSession');
      
      const result = await createPortalSession({
        customerId,
        returnUrl
      });

      const data = result.data as { url: string };
      
      Logger.success('Customer portal session created:', data);
      return data;

    } catch (error) {
      Logger.error('Failed to create customer portal session:', error);
      throw error;
    }
  }

  /**
   * Format price for display (cents to Rand)
   */
  formatPrice(priceInCents: number): string {
    return `R${(priceInCents / 100).toFixed(2)}`;
  }

  /**
   * Get subscription status display text
   */
  getStatusDisplay(status: Subscription['status']): {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
  } {
    switch (status) {
      case 'active':
        return { text: 'Active', color: 'green' };
      case 'past_due':
        return { text: 'Payment Due', color: 'yellow' };
      case 'unpaid':
        return { text: 'Payment Failed', color: 'red' };
      case 'canceled':
        return { text: 'Canceled', color: 'gray' };
      default:
        return { text: 'Unknown', color: 'gray' };
    }
  }

  /**
   * Validate subscription limits
   */
  validateSubscriptionLimits(subscription: Subscription, employeeCount: number): {
    isValid: boolean;
    message?: string;
    suggestedAction?: 'upgrade' | 'remove_employees';
  } {
    const plan = SUBSCRIPTION_PLANS[subscription.plan];
    
    if (employeeCount <= plan.employeeLimit) {
      return { isValid: true };
    }

    const overLimit = employeeCount - plan.employeeLimit;
    
    return {
      isValid: false,
      message: `Your organization has ${employeeCount} employees but your ${plan.name} plan only supports ${plan.employeeLimit}. You are ${overLimit} employees over the limit.`,
      suggestedAction: 'upgrade'
    };
  }
}

export default new StripeService();