// frontend/src/components/admin/FinancialDashboard.tsx
// Financial management dashboard for SuperAdmin
// Records client payments and manages commission tracking

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Building2,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  CreditCard,
  Banknote,
  X
} from 'lucide-react';
import { ThemedCard } from '../common/ThemedCard';
import { UnifiedModal } from '../common/UnifiedModal';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import Logger from '../../utils/logger';
import type { Organization } from '../../types/core';
import type { Commission } from '../../types/billing';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface FinancialDashboardProps {
  organizations: Organization[];
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ organizations }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    organizationId: '',
    amountRands: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'debit_order' as 'debit_order' | 'eft' | 'payfast' | 'manual',
    paymentReference: '',
    notes: ''
  });

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      Logger.debug('Loading commissions...');

      const commissionsRef = collection(db, 'commissions');
      const commissionsQuery = query(
        commissionsRef,
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(commissionsQuery);
      const commissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commission[];

      setCommissions(commissionsData);
      Logger.success(`Loaded ${commissionsData.length} commission records`);
    } catch (error) {
      Logger.error('Failed to load commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.organizationId || !paymentForm.amountRands) {
      Logger.warn('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);
      Logger.debug('Recording client payment...', paymentForm);

      // Convert Rands to cents
      const amountInCents = Math.round(parseFloat(paymentForm.amountRands) * 100);

      await CommissionService.recordClientPayment({
        organizationId: paymentForm.organizationId,
        amountInCents,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        paymentReference: paymentForm.paymentReference || undefined,
        notes: paymentForm.notes || undefined
      });

      Logger.success('Payment recorded successfully');
      setShowPaymentModal(false);
      resetForm();
      await loadCommissions();
    } catch (error) {
      Logger.error('Failed to record payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentForm({
      organizationId: '',
      amountRands: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'debit_order',
      paymentReference: '',
      notes: ''
    });
  };

  const formatCurrency = (amountInCents: number): string => {
    return `R${(amountInCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const getOrgName = (orgId: string): string => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || orgId;
  };

  // Calculate summary stats
  const totalRevenue = commissions.reduce((sum, c) => sum + c.clientRevenue, 0);
  const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingCommissions = commissions.filter(c => c.status === 'pending' || c.status === 'calculated');
  const paidCommissions = commissions.filter(c => c.status === 'paid');

  const paymentMethodIcon = (method: string) => {
    switch (method) {
      case 'debit_order': return <CreditCard className="w-4 h-4" />;
      case 'eft': return <Banknote className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ThemedCard padding="md" shadow="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Revenue</div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalRevenue)}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md" shadow="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Commissions</div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalCommissions)}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md" shadow="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Pending Payouts</div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {pendingCommissions.length}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard padding="md" shadow="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Paid Commissions</div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {paidCommissions.length}
              </div>
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Record Payment Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)'
          }}
        >
          <Plus className="w-4 h-4" />
          Record Client Payment
        </button>
      </div>

      {/* Commissions Table */}
      <ThemedCard padding="none" shadow="md">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Commission History
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            50% Reseller | 30% Owner | 20% Operations
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              No Payments Recorded
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Record your first client payment to start tracking commissions
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: 'var(--color-background-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Payment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Fees
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Reseller (50%)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Owner (30%)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        <div>
                          <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {getOrgName(commission.organizationId)}
                          </div>
                          <div className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {paymentMethodIcon(commission.paymentMethod || 'manual')}
                            {commission.paymentMethod || 'manual'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(commission.periodStart).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(commission.clientRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      -{formatCurrency(commission.paymentFees)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-green-600">
                      {formatCurrency(commission.commissionAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-blue-600">
                      {formatCurrency(commission.ownerAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        commission.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : commission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {commission.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {commission.status === 'pending' && <Clock className="w-3 h-3" />}
                        {commission.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ThemedCard>

      {/* Record Payment Modal */}
      <UnifiedModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          resetForm();
        }}
        title="Record Client Payment"
        size="md"
      >
        <div className="space-y-4 p-6">
          {/* Organization Selection */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Client Organization *
            </label>
            <select
              value={paymentForm.organizationId}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, organizationId: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="">Select organization...</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Amount (Rands) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.amountRands}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amountRands: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border)' }}
                placeholder="5000.00"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Payment Method
            </label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="debit_order">Debit Order (R5 fee)</option>
              <option value="eft">EFT (No fees)</option>
              <option value="payfast">PayFast (3.5% + R2)</option>
              <option value="manual">Manual/Other (2.5%)</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Payment Reference
            </label>
            <input
              type="text"
              value={paymentForm.paymentReference}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)' }}
              placeholder="Bank reference or transaction ID"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
              Notes (optional)
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border)' }}
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Commission Preview */}
          {paymentForm.amountRands && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-background-secondary)' }}>
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Commission Preview
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Reseller (50%)</div>
                  <div className="font-bold text-green-600">
                    R{((parseFloat(paymentForm.amountRands) || 0) * 0.50 * 0.975).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Owner (30%)</div>
                  <div className="font-bold text-blue-600">
                    R{((parseFloat(paymentForm.amountRands) || 0) * 0.30 * 0.975).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Operations (20%)</div>
                  <div className="font-bold text-purple-600">
                    R{((parseFloat(paymentForm.amountRands) || 0) * 0.20 * 0.975).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-center mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                * After ~2.5% payment fees
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => {
              setShowPaymentModal(false);
              resetForm();
            }}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleRecordPayment}
            disabled={submitting || !paymentForm.organizationId || !paymentForm.amountRands}
            className="px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)'
            }}
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </UnifiedModal>
    </div>
  );
};
