// frontend/src/services/CommissionService.ts
// Commission tracking and payout management for reseller network

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DataService } from './DataService';
import { ShardedDataService } from './ShardedDataService';
import Logger from '../utils/logger';
import type { 
  Commission, 
  Reseller, 
  MonthlyCommissionReport, 
  RevenueMetrics,
  SouthAfricanProvince
} from '../types/billing';

class CommissionService {
  
  /**
   * Calculate commission when payment is received from Stripe webhook
   */
  async calculateCommission(params: {
    organizationId: string;
    subscriptionId: string;
    stripeEventId: string;
    grossAmount: number; // What client paid in cents
    stripeFees: number; // Stripe processing fees in cents
    periodStart: string;
    periodEnd: string;
  }): Promise<Commission> {
    try {
      Logger.debug('Calculating commission for payment...', params);

      // Get organization to find reseller
      const organization = await DataService.getOrganization(params.organizationId);
      if (!organization?.resellerId) {
        throw new Error('No reseller assigned to organization');
      }

      // Get reseller details  
      const reseller = await DataService.getReseller(organization.resellerId);
      if (!reseller) {
        throw new Error('Reseller not found');
      }

      const netRevenue = params.grossAmount - params.stripeFees;
      
      // Your 50/30/20 split on NET revenue (after Stripe fees)
      const commissionAmount = Math.round(netRevenue * 0.50); // 50% to reseller
      const ownerAmount = Math.round(netRevenue * 0.30);       // 30% to you  
      const companyAmount = Math.round(netRevenue * 0.20);     // 20% to company

      const commission: Commission = {
        id: `${params.organizationId}-${params.periodStart}`,
        resellerId: organization.resellerId,
        organizationId: params.organizationId,
        subscriptionId: params.subscriptionId,
        
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        
        clientRevenue: params.grossAmount,
        stripeFees: params.stripeFees,
        netRevenue: netRevenue,
        commissionAmount: commissionAmount,
        ownerAmount: ownerAmount,
        companyAmount: companyAmount,
        
        status: 'calculated', // Will become 'pending' after 30 days
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save commission record
      await setDoc(doc(db, 'commissions', commission.id), commission);
      
      Logger.success('Commission calculated and saved:', commission);
      return commission;

    } catch (error) {
      Logger.error('Failed to calculate commission:', error);
      throw error;
    }
  }

  /**
   * Process monthly commission payouts (30 days after payment)
   * Run this daily via scheduled function
   */
  async processMonthlyPayouts(): Promise<MonthlyCommissionReport[]> {
    try {
      Logger.debug('Processing monthly commission payouts...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get all calculated commissions older than 30 days
      const commissionsRef = collection(db, 'commissions');
      const eligibleQuery = query(
        commissionsRef,
        where('status', '==', 'calculated'),
        where('createdAt', '<', thirtyDaysAgo.toISOString())
      );

      const snapshot = await getDocs(eligibleQuery);
      const eligibleCommissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];

      Logger.debug(`Found ${eligibleCommissions.length} eligible commissions for payout`);

      // Group by reseller and month
      const commissionsByReseller = this.groupCommissionsByResellerMonth(eligibleCommissions);
      
      const reports: MonthlyCommissionReport[] = [];
      
      for (const [resellerMonth, commissions] of Object.entries(commissionsByReseller)) {
        const [resellerId, month] = resellerMonth.split('|');
        const reseller = await DataService.getReseller(resellerId);
        
        if (!reseller) continue;

        const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        const totalRevenue = commissions.reduce((sum, c) => sum + c.netRevenue, 0);

        const report: MonthlyCommissionReport = {
          resellerId,
          resellerName: `${reseller.firstName} ${reseller.lastName}`,
          month,
          province: reseller.province,
          
          totalClients: commissions.length,
          totalRevenue,
          totalCommission,
          
          commissions,
          
          payoutStatus: 'pending',
          payoutDate: new Date().toISOString()
        };

        // Save report
        await setDoc(doc(db, 'commissionReports', `${resellerId}-${month}`), report);
        
        // Mark commissions as pending payout
        const batch = writeBatch(db);
        for (const commission of commissions) {
          batch.update(doc(db, 'commissions', commission.id), {
            status: 'pending',
            updatedAt: serverTimestamp()
          });
        }
        await batch.commit();

        reports.push(report);
        
        Logger.success(`Generated commission report for ${reseller.firstName} ${reseller.lastName}: R${(totalCommission / 100).toFixed(2)}`);
      }

      return reports;

    } catch (error) {
      Logger.error('Failed to process monthly payouts:', error);
      throw error;
    }
  }

  /**
   * Mark commission report as paid (when you've done EFT transfer)
   */
  async markCommissionsPaid(
    resellerId: string,
    month: string,
    payoutReference: string
  ): Promise<void> {
    try {
      Logger.debug('Marking commissions as paid...', { resellerId, month, payoutReference });

      const reportId = `${resellerId}-${month}`;
      
      // Update report
      await updateDoc(doc(db, 'commissionReports', reportId), {
        payoutStatus: 'paid',
        payoutReference,
        updatedAt: serverTimestamp()
      });

      // Update individual commissions
      const commissionsRef = collection(db, 'commissions');
      const commissionsQuery = query(
        commissionsRef,
        where('resellerId', '==', resellerId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(commissionsQuery);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(docSnapshot => {
        batch.update(docSnapshot.ref, {
          status: 'paid',
          payoutReference,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      Logger.success('Commissions marked as paid', { resellerId, month, payoutReference });

    } catch (error) {
      Logger.error('Failed to mark commissions as paid:', error);
      throw error;
    }
  }

  /**
   * Get reseller performance metrics for dashboard
   */
  async getResellerMetrics(resellerId: string): Promise<{
    totalClients: number;
    activeClients: number;
    monthlyRecurringRevenue: number;
    totalCommissionsEarned: number;
    monthlyCommissions: number;
    averageClientValue: number;
    monthlyGrowth: number;
    conversionRate: number;
    topPerformingClient: string;
  }> {
    try {
      Logger.debug(`Getting metrics for reseller: ${resellerId}`);
      
      const reseller = await DataService.getReseller(resellerId);
      if (!reseller) throw new Error('Reseller not found');

      // Get reseller's clients
      const clients = await DataService.getResellerClients(resellerId);
      const activeClients = clients.filter(client => client.isActive !== false);

      // Get all commissions for this reseller
      const commissionsRef = collection(db, 'commissions');
      const commissionsQuery = query(
        commissionsRef,
        where('resellerId', '==', resellerId)
      );

      const snapshot = await getDocs(commissionsQuery);
      const commissions = snapshot.docs.map(doc => doc.data()) as Commission[];

      const totalCommissionsEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const totalRevenue = commissions.reduce((sum, c) => sum + c.netRevenue, 0);
      
      // Current month metrics
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthCommissions = commissions.filter(c => 
        c.periodStart.startsWith(currentMonth)
      );
      
      const monthlyRecurringRevenue = currentMonthCommissions.reduce((sum, c) => sum + c.netRevenue, 0);
      const monthlyCommissions = currentMonthCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

      // Calculate average client value
      const averageClientValue = activeClients.length > 0 ? monthlyRecurringRevenue / activeClients.length : 0;

      // Find top performing client
      let topPerformingClient = 'None';
      if (clients.length > 0) {
        const clientRevenues = clients.map(client => ({
          name: client.name,
          revenue: client.monthlySubscription || 0
        }));
        const topClient = clientRevenues.sort((a, b) => b.revenue - a.revenue)[0];
        if (topClient.revenue > 0) {
          topPerformingClient = topClient.name;
        }
      }

      // Calculate monthly growth (simplified - compare current vs previous month)
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const prevMonthKey = previousMonth.toISOString().slice(0, 7);
      
      const prevMonthCommissions = commissions.filter(c => 
        c.periodStart.startsWith(prevMonthKey)
      );
      const prevMonthRevenue = prevMonthCommissions.reduce((sum, c) => sum + c.netRevenue, 0);
      
      const monthlyGrowth = prevMonthRevenue > 0 
        ? ((monthlyRecurringRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      // Conversion rate placeholder (would need lead tracking data)
      const conversionRate = 75; // Default placeholder percentage

      const metrics = {
        totalClients: clients.length,
        activeClients: activeClients.length,
        monthlyRecurringRevenue,
        totalCommissionsEarned,
        monthlyCommissions,
        averageClientValue,
        monthlyGrowth,
        conversionRate,
        topPerformingClient
      };

      Logger.success('Reseller metrics calculated:', metrics);
      return metrics;

    } catch (error) {
      Logger.error('Failed to get reseller metrics:', error);
      // Return default metrics to prevent dashboard crash
      return {
        totalClients: 0,
        activeClients: 0,
        monthlyRecurringRevenue: 0,
        totalCommissionsEarned: 0,
        monthlyCommissions: 0,
        averageClientValue: 0,
        monthlyGrowth: 0,
        conversionRate: 0,
        topPerformingClient: 'None'
      };
    }
  }

  /**
   * Get provincial revenue breakdown for SuperUser dashboard
   */
  async getProvincialMetrics(): Promise<Record<SouthAfricanProvince, {
    resellers: number;
    clients: number;
    monthlyRevenue: number;
    commissionsOwed: number;
    topPerformer?: string;
  }>> {
    try {
      Logger.debug('Getting provincial metrics...');

      const resellers = await DataService.getAllResellers();
      const metrics = {} as any;

      for (const reseller of resellers) {
        const province = reseller.province;
        
        if (!metrics[province]) {
          metrics[province] = {
            resellers: 0,
            clients: 0,
            monthlyRevenue: 0,
            commissionsOwed: 0
          };
        }

        metrics[province].resellers += 1;
        metrics[province].clients += reseller.clientIds.length;
        metrics[province].monthlyRevenue += reseller.monthlyRecurringRevenue;

        // Get pending commissions for this reseller
        const pendingCommissionsRef = collection(db, 'commissions');
        const pendingQuery = query(
          pendingCommissionsRef,
          where('resellerId', '==', reseller.id),
          where('status', 'in', ['pending', 'calculated'])
        );
        
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingAmount = pendingSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().commissionAmount || 0);
        }, 0);

        metrics[province].commissionsOwed += pendingAmount;
      }

      Logger.success('Provincial metrics calculated:', metrics);
      return metrics;

    } catch (error) {
      Logger.error('Failed to get provincial metrics:', error);
      throw error;
    }
  }

  /**
   * Helper: Group commissions by reseller and month
   */
  private groupCommissionsByResellerMonth(commissions: Commission[]): Record<string, Commission[]> {
    const grouped: Record<string, Commission[]> = {};
    
    for (const commission of commissions) {
      const month = commission.periodStart.slice(0, 7); // YYYY-MM
      const key = `${commission.resellerId}|${month}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(commission);
    }
    
    return grouped;
  }

  /**
   * Get recent commission statements for reseller dashboard
   */
  async getRecentCommissions(resellerId: string, limit: number = 5): Promise<Array<{
    id: string;
    clientName: string;
    periodStart: string;
    periodEnd: string;
    commissionAmount: number;
    baseAmount: number;
    commissionRate: number;
  }>> {
    try {
      Logger.debug(`Getting recent commissions for reseller: ${resellerId}`);

      const commissionsRef = collection(db, 'commissions');
      const commissionsQuery = query(
        commissionsRef,
        where('resellerId', '==', resellerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(commissionsQuery);
      const commissions = snapshot.docs.map(doc => doc.data() as Commission);

      const results = [];
      for (let i = 0; i < Math.min(commissions.length, limit); i++) {
        const commission = commissions[i];
        
        // Get organization name for client name
        let clientName = 'Unknown Client';
        try {
          const org = await DataService.getOrganization(commission.organizationId);
          if (org) clientName = org.name;
        } catch (error) {
          Logger.warn(`Could not get organization name for ${commission.organizationId}`);
        }

        results.push({
          id: commission.id,
          clientName,
          periodStart: commission.periodStart,
          periodEnd: commission.periodEnd,
          commissionAmount: commission.commissionAmount,
          baseAmount: commission.netRevenue,
          commissionRate: 0.50 // 50% commission rate
        });
      }

      Logger.success(`Retrieved ${results.length} recent commissions for reseller`);
      return results;

    } catch (error) {
      Logger.error('Failed to get recent commissions:', error);
      return [];
    }
  }

  /**
   * Get performance trend data for reseller dashboard
   */
  async getPerformanceTrend(resellerId: string, timeframe: '3m' | '6m' | '12m'): Promise<Array<{
    month: string;
    revenue: number;
    commissions: number;
  }>> {
    try {
      Logger.debug(`Getting performance trend for reseller: ${resellerId}, timeframe: ${timeframe}`);

      const months = timeframe === '3m' ? 3 : timeframe === '6m' ? 6 : 12;
      
      const commissionsRef = collection(db, 'commissions');
      const commissionsQuery = query(
        commissionsRef,
        where('resellerId', '==', resellerId),
        orderBy('periodStart', 'desc')
      );

      const snapshot = await getDocs(commissionsQuery);
      const commissions = snapshot.docs.map(doc => doc.data() as Commission);

      // Group by month
      const monthlyData: Record<string, { revenue: number; commissions: number }> = {};
      
      commissions.forEach(commission => {
        const monthKey = commission.periodStart.slice(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, commissions: 0 };
        }
        monthlyData[monthKey].revenue += commission.netRevenue;
        monthlyData[monthKey].commissions += commission.commissionAmount;
      });

      // Generate last N months
      const results = [];
      const currentDate = new Date();
      
      for (let i = 0; i < months; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        results.unshift({
          month: monthName,
          revenue: monthlyData[monthKey]?.revenue || 0,
          commissions: monthlyData[monthKey]?.commissions || 0
        });
      }

      Logger.success(`Retrieved ${results.length} months of performance data for reseller`);
      return results;

    } catch (error) {
      Logger.error('Failed to get performance trend:', error);
      return [];
    }
  }

  /**
   * Generate commission statement download (placeholder)
   */
  async generateCommissionStatement(resellerId: string): Promise<void> {
    try {
      Logger.debug(`Generating commission statement for reseller: ${resellerId}`);
      
      // TODO: Implement PDF generation for commission statements
      // For now, just log that the feature was requested
      Logger.warn('Commission statement generation not yet implemented - feature requested');
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      Logger.error('Failed to generate commission statement:', error);
      throw error;
    }
  }


  /**
   * Get metrics for a specific client/organization
   */
  async getClientMetrics(organizationId: string): Promise<{
    monthlyRevenue: number;
    employeeCount: number;
    lastActivity: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
    warningsThisMonth: number;
    complianceScore: number;
  }> {
    try {
      Logger.debug('Loading client metrics...', { organizationId });
      
      // Get organization details
      const organization = await DataService.getOrganization(organizationId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      
      // Get employees count using sharded structure
      const employeesResult = await ShardedDataService.loadEmployees(organizationId);
      const employees = employeesResult.documents;

      // Get recent warnings using sharded structure
      const warningsResult = await ShardedDataService.loadWarnings(organizationId);
      const warnings = warningsResult.documents;
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const warningsThisMonth = warnings.filter(w => 
        new Date(w.issueDate) >= thisMonth
      ).length;
      
      return {
        monthlyRevenue: organization.monthlySubscription || 50000,
        employeeCount: employees.length,
        lastActivity: new Date().toISOString(),
        subscriptionStatus: organization.isActive === false ? 'inactive' : 'active',
        warningsThisMonth,
        complianceScore: Math.max(95 - (warningsThisMonth * 5), 60) // Simple scoring
      };
      
    } catch (error) {
      Logger.error('Failed to get client metrics:', error);
      return {
        monthlyRevenue: 0,
        employeeCount: 0,
        lastActivity: new Date().toISOString(),
        subscriptionStatus: 'inactive',
        warningsThisMonth: 0,
        complianceScore: 0
      };
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amountInCents: number): string {
    return `R${(amountInCents / 100).toFixed(2)}`;
  }
}

export default new CommissionService();