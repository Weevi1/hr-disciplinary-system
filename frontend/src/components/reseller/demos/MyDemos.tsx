// frontend/src/components/reseller/demos/MyDemos.tsx
// Reseller's demo organization list: deploy / open / new prospect login / reset / delete.

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Plus,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  Clock,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import Logger from '../../../utils/logger';
import { ResellerDemoService } from '../../../services/ResellerDemoService';
import type { Organization } from '../../../types/core';
import { DeployDemoModal } from './DeployDemoModal';
import { ProspectLoginModal } from './ProspectLoginModal';
import { ResetDemoConfirmModal } from './ResetDemoConfirmModal';
import { DeleteDemoConfirmModal } from './DeleteDemoConfirmModal';

const DEMO_LIMIT = 5;

type ActiveModal =
  | { type: 'deploy' }
  | { type: 'prospect'; orgId: string; orgName: string }
  | { type: 'reset'; orgId: string; orgName: string }
  | { type: 'delete'; orgId: string; orgName: string }
  | null;

export const MyDemos: React.FC = () => {
  const { user } = useAuth();
  const [demos, setDemos] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const loadDemos = useCallback(async () => {
    if (!user?.resellerId) return;
    setLoading(true);
    try {
      const list = await ResellerDemoService.listDemos(user.resellerId);
      // Sort: newest first, by demoMetadata.createdAt fallback to createdAt
      list.sort((a, b) => {
        const aTime = a.demoMetadata?.createdAt || a.createdAt || '';
        const bTime = b.demoMetadata?.createdAt || b.createdAt || '';
        return bTime.localeCompare(aTime);
      });
      setDemos(list);
    } catch (err) {
      Logger.error('Failed to load demos:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.resellerId]);

  useEffect(() => {
    loadDemos();
  }, [loadDemos]);

  const activeCount = demos.filter(d => d.isActive !== false).length;
  const atLimit = activeCount >= DEMO_LIMIT;

  const formatDate = (iso?: string): string => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const formatRelative = (iso?: string): string => {
    if (!iso) return 'never';
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-3 text-gray-600">Loading your demos…</span>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (demos.length === 0) {
    return (
      <>
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
          <FlaskConical className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No demos yet</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-5">
            Deploy a pre-populated demo organization so prospects can test the system. You can
            create up to {DEMO_LIMIT} active demos and reset each one between prospects.
          </p>
          <button
            onClick={() => setActiveModal({ type: 'deploy' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Deploy Your First Demo
          </button>
        </div>

        {activeModal?.type === 'deploy' && (
          <DeployDemoModal
            isOpen
            onClose={() => setActiveModal(null)}
            onDeployed={async () => {
              setActiveModal(null);
              await loadDemos();
            }}
          />
        )}
      </>
    );
  }

  // ── Populated list ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">My Demos</h3>
            <span className="text-sm text-gray-500">
              {activeCount} of {DEMO_LIMIT} active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Reusable prospect-testing environments — reset between prospects.
          </p>
        </div>
        <button
          onClick={() => setActiveModal({ type: 'deploy' })}
          disabled={atLimit}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          title={atLimit ? `Limit reached (${DEMO_LIMIT}). Delete a demo to deploy another.` : undefined}
        >
          <Plus className="w-4 h-4" />
          Deploy Demo
        </button>
      </div>

      {atLimit && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
          You've reached the {DEMO_LIMIT}-demo limit. Delete or reuse an existing demo to deploy a
          new one.
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Reset
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logins
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {demos.map(demo => {
                const meta = demo.demoMetadata;
                const loginCount = meta?.activeProspectLoginIds?.length || 0;
                return (
                  <tr key={demo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{demo.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{demo.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(meta?.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {meta?.lastResetAt ? (
                        <div>
                          <div>{formatRelative(meta.lastResetAt)}</div>
                          <div className="text-xs text-gray-400">
                            {meta.resetCount} total
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {loginCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setActiveModal({
                              type: 'prospect',
                              orgId: demo.id,
                              orgName: demo.name
                            })
                          }
                          title="Create prospect login"
                          className="p-1.5 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveModal({
                              type: 'reset',
                              orgId: demo.id,
                              orgName: demo.name
                            })
                          }
                          title="Reset to pristine state"
                          className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveModal({
                              type: 'delete',
                              orgId: demo.id,
                              orgName: demo.name
                            })
                          }
                          title="Permanently delete demo"
                          className="p-1.5 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3.5 h-3.5" />
        <span>
          Resets wipe data and re-seed the canonical 10-employee template. Deletes are
          permanent.
        </span>
      </div>

      {/* Modals */}
      {activeModal?.type === 'deploy' && (
        <DeployDemoModal
          isOpen
          onClose={() => setActiveModal(null)}
          onDeployed={async () => {
            setActiveModal(null);
            await loadDemos();
          }}
        />
      )}
      {activeModal?.type === 'prospect' && (
        <ProspectLoginModal
          isOpen
          orgId={activeModal.orgId}
          orgName={activeModal.orgName}
          onClose={() => setActiveModal(null)}
          onCreated={loadDemos}
        />
      )}
      {activeModal?.type === 'reset' && (
        <ResetDemoConfirmModal
          isOpen
          orgId={activeModal.orgId}
          orgName={activeModal.orgName}
          onClose={() => setActiveModal(null)}
          onReset={async () => {
            setActiveModal(null);
            await loadDemos();
          }}
        />
      )}
      {activeModal?.type === 'delete' && (
        <DeleteDemoConfirmModal
          isOpen
          orgId={activeModal.orgId}
          orgName={activeModal.orgName}
          onClose={() => setActiveModal(null)}
          onDeleted={async () => {
            setActiveModal(null);
            await loadDemos();
          }}
        />
      )}
    </div>
  );
};
