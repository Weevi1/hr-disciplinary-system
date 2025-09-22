// frontend/src/types/billing.ts
// White-label billing system with provincial reseller network

import type { EncryptedField } from '../services/EncryptionService';

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise' | 'enterprise-plus';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number; // in cents (R299 = 29900)
  currency: 'ZAR';
  employeeLimit: number;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  employeeCount: number;
  monthlyRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reseller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  province: SouthAfricanProvince;
  territory: string[]; // Cities/regions within province
  commissionRate: number; // 0.50 for 50%
  isActive: boolean;
  
  // Banking details for payouts (with encryption support)
  bankDetails: {
    accountHolder: string;
    bank: string;
    accountNumber: string | EncryptedField; // Can be encrypted or plain text (migration)
    branchCode: string | EncryptedField;    // Can be encrypted or plain text (migration)
  };
  
  // Performance tracking
  clientIds: string[];
  totalClientsAcquired: number;
  monthlyRecurringRevenue: number;
  totalCommissionsEarned: number;
  
  createdAt: string;
  updatedAt: string;
}

export type SouthAfricanProvince = 
  | 'western-cape'
  | 'eastern-cape' 
  | 'northern-cape'
  | 'free-state'
  | 'kwazulu-natal'
  | 'north-west'
  | 'gauteng'
  | 'mpumalanga'
  | 'limpopo';

export interface Commission {
  id: string;
  resellerId: string;
  organizationId: string;
  subscriptionId: string;
  
  // Period this commission covers
  periodStart: string;
  periodEnd: string;
  
  // Financial details
  clientRevenue: number; // What client paid
  stripeFees: number; // Stripe processing fees
  netRevenue: number; // After Stripe fees
  commissionAmount: number; // 50% of net revenue
  ownerAmount: number; // 30% of net revenue  
  companyAmount: number; // 20% of net revenue
  
  // Payment tracking
  status: 'pending' | 'calculated' | 'paid' | 'failed';
  payoutDate?: string;
  payoutReference?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyCommissionReport {
  resellerId: string;
  resellerName: string;
  month: string; // 2025-01
  province: SouthAfricanProvince;
  
  // Summary
  totalClients: number;
  totalRevenue: number;
  totalCommission: number;
  
  // Individual commissions
  commissions: Commission[];
  
  // Payout details
  payoutStatus: 'pending' | 'processed' | 'paid';
  payoutDate?: string;
  payoutReference?: string;
}

export interface CommissionStatement {
  id: string;
  resellerId: string;
  clientId: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  baseAmount: number; // Client subscription amount
  commissionRate: number; // e.g. 0.50 for 50%
  commissionAmount: number; // Final commission earned
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

export interface RevenueMetrics {
  // Overall business metrics
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalActiveSubscriptions: number;
  churnRate: number;
  
  // By subscription tier
  tierBreakdown: {
    [K in SubscriptionTier]: {
      count: number;
      revenue: number;
    }
  };
  
  // By province
  provinceBreakdown: {
    [K in SouthAfricanProvince]: {
      clients: number;
      revenue: number;
      resellers: number;
    }
  };
  
  // Financial breakdown
  totalRevenue: number;
  stripeFees: number;
  resellerCommissions: number;
  ownerIncome: number;
  companyFund: number;
  
  // Growth metrics
  newClientsThisMonth: number;
  churndClientsThisMonth: number;
  revenueGrowthRate: number;
}

// Standard subscription plans for South African market
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29900, // R299.00
    currency: 'ZAR',
    employeeLimit: 10,
    features: [
      'Up to 10 employees',
      'Basic warning management',
      'PDF document generation',
      'Email notifications',
      'Basic reporting'
    ]
  },
  professional: {
    id: 'professional', 
    name: 'Professional',
    price: 49900, // R499.00
    currency: 'ZAR',
    employeeLimit: 50,
    features: [
      'Up to 50 employees',
      'Advanced warning workflows',
      'Custom warning categories',
      'WhatsApp notifications',
      'Advanced reporting',
      'Counselling management'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise', 
    price: 79900, // R799.00
    currency: 'ZAR',
    employeeLimit: 200,
    features: [
      'Up to 200 employees',
      'Full HR disciplinary suite',
      'Custom document templates',
      'API access',
      'Priority support',
      'Advanced analytics'
    ]
  },
  'enterprise-plus': {
    id: 'enterprise-plus',
    name: 'Enterprise Plus',
    price: 129900, // R1299.00
    currency: 'ZAR', 
    employeeLimit: 999999, // Unlimited
    features: [
      'Unlimited employees',
      'White-label branding',
      'Multi-location support',
      'Dedicated account manager',
      'Custom integrations',
      'On-site training'
    ]
  }
};

// South African provinces with major cities
export const SA_PROVINCES: Record<SouthAfricanProvince, { name: string; cities: string[] }> = {
  'western-cape': {
    name: 'Western Cape',
    cities: ['Cape Town', 'Stellenbosch', 'George', 'Paarl', 'Worcester']
  },
  'gauteng': {
    name: 'Gauteng', 
    cities: ['Johannesburg', 'Pretoria', 'Ekurhuleni', 'Germiston', 'Benoni']
  },
  'kwazulu-natal': {
    name: 'KwaZulu-Natal',
    cities: ['Durban', 'Pietermaritzburg', 'Newcastle', 'Ladysmith', 'Richards Bay']
  },
  'eastern-cape': {
    name: 'Eastern Cape',
    cities: ['Port Elizabeth', 'East London', 'Uitenhage', 'King Williams Town', 'Grahamstown']
  },
  'free-state': {
    name: 'Free State', 
    cities: ['Bloemfontein', 'Welkom', 'Kroonstad', 'Bethlehem', 'Sasolburg']
  },
  'limpopo': {
    name: 'Limpopo',
    cities: ['Polokwane', 'Thohoyandou', 'Tzaneen', 'Giyani', 'Musina']
  },
  'mpumalanga': {
    name: 'Mpumalanga',
    cities: ['Nelspruit', 'Witbank', 'Secunda', 'Standerton', 'Ermelo']
  },
  'northern-cape': {
    name: 'Northern Cape',
    cities: ['Kimberley', 'Upington', 'Kuruman', 'De Aar', 'Springbok']
  },
  'north-west': {
    name: 'North West',
    cities: ['Mahikeng', 'Klerksdorp', 'Rustenburg', 'Potchefstroom', 'Brits']
  }
};