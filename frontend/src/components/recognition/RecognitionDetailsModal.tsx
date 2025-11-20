// frontend/src/components/recognition/RecognitionDetailsModal.tsx
// Recognition Details Modal - Full view of recognition record with certificate download

import React, { useState } from 'react';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../constants/zIndex';
import {
  X, Award, Calendar, User, Building, Download, Printer,
  Trophy, Star, Users, Heart, Shield, Lightbulb, Target,
  Sparkles, Zap, TrendingUp, Gift, FileText, Eye
} from 'lucide-react';
import type { Recognition, RecognitionType } from '../../types/core';
import { ThemedCard } from '../common/ThemedCard';

interface RecognitionDetailsModalProps {
  recognition: Recognition | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateCertificate?: (recognitionId: string) => Promise<void>;
}

// Recognition type configuration (same as dashboard)
const RECOGNITION_TYPE_CONFIG: Record<RecognitionType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  exceptional_performance: {
    label: 'Exceptional Performance',
    icon: <Trophy className="w-5 h-5" />,
    color: '#f59e0b',
    bgColor: '#fef3c7'
  },
  going_above_beyond: {
    label: 'Going Above & Beyond',
    icon: <Star className="w-5 h-5" />,
    color: '#3b82f6',
    bgColor: '#dbeafe'
  },
  innovation: {
    label: 'Innovation',
    icon: <Lightbulb className="w-5 h-5" />,
    color: '#8b5cf6',
    bgColor: '#ede9fe'
  },
  teamwork: {
    label: 'Teamwork',
    icon: <Users className="w-5 h-5" />,
    color: '#10b981',
    bgColor: '#d1fae5'
  },
  leadership: {
    label: 'Leadership',
    icon: <Target className="w-5 h-5" />,
    color: '#ef4444',
    bgColor: '#fee2e2'
  },
  customer_service: {
    label: 'Customer Service',
    icon: <Heart className="w-5 h-5" />,
    color: '#ec4899',
    bgColor: '#fce7f3'
  },
  safety_excellence: {
    label: 'Safety Excellence',
    icon: <Shield className="w-5 h-5" />,
    color: '#06b6d4',
    bgColor: '#cffafe'
  },
  continuous_improvement: {
    label: 'Continuous Improvement',
    icon: <TrendingUp className="w-5 h-5" />,
    color: '#14b8a6',
    bgColor: '#ccfbf1'
  },
  mentorship: {
    label: 'Mentorship',
    icon: <Sparkles className="w-5 h-5" />,
    color: '#f97316',
    bgColor: '#ffedd5'
  },
  problem_solving: {
    label: 'Problem Solving',
    icon: <Zap className="w-5 h-5" />,
    color: '#eab308',
    bgColor: '#fef9c3'
  }
};

// Reward type labels
const REWARD_TYPE_LABELS: Record<string, string> = {
  verbal_praise: 'Verbal Praise',
  certificate: 'Certificate',
  monetary_bonus: 'Monetary Bonus',
  gift_voucher: 'Gift Voucher',
  extra_leave_day: 'Extra Leave Day',
  public_recognition: 'Public Recognition',
  career_development: 'Career Development Opportunity',
  none: 'No Tangible Reward'
};

export const RecognitionDetailsModal: React.FC<RecognitionDetailsModalProps> = ({
  recognition,
  isOpen,
  onClose,
  onGenerateCertificate
}) => {
  usePreventBodyScroll(isOpen);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  if (!isOpen || !recognition) return null;

  const config = RECOGNITION_TYPE_CONFIG[recognition.recognitionType];

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerateCertificate = async () => {
    if (!onGenerateCertificate) return;

    try {
      setGeneratingCertificate(true);
      await onGenerateCertificate(recognition.id);
    } catch (error) {
      console.error('Failed to generate certificate:', error);
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (recognition.certificateUrl) {
      window.open(recognition.certificateUrl, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 overflow-y-auto"
        style={{ zIndex: Z_INDEX.MODAL }}
        aria-labelledby="recognition-modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-3xl rounded-xl shadow-2xl"
            style={{
              backgroundColor: 'var(--color-card-background)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between p-6 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Recognition Type Badge */}
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <span style={{ color: config.color }}>{config.icon}</span>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h2
                    id="recognition-modal-title"
                    className="text-2xl font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {recognition.achievementTitle}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: config.bgColor,
                        color: config.color
                      }}
                    >
                      {config.label}
                    </span>
                    {recognition.isPublic && (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--color-background-secondary)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        Public Recognition
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{
                  color: 'var(--color-text-tertiary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Employee Information */}
              <ThemedCard padding="md">
                <div className="flex items-start gap-4">
                  {recognition.employeePhotoUrl && (
                    <img
                      src={recognition.employeePhotoUrl}
                      alt={recognition.employeeName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Employee
                      </span>
                    </div>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {recognition.employeeName}
                    </p>
                    {recognition.employeeRole && (
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {recognition.employeeRole}
                      </p>
                    )}
                    {recognition.departmentName && (
                      <div className="flex items-center gap-2 mt-2">
                        <Building className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {recognition.departmentName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </ThemedCard>

              {/* Achievement Description */}
              <ThemedCard padding="md">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                      Achievement Description
                    </span>
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                    {recognition.achievementDescription}
                  </p>
                </div>
              </ThemedCard>

              {/* Business Impact */}
              {recognition.businessImpact && (
                <ThemedCard padding="md">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: '#10b981' }}>
                        Business Impact
                      </span>
                    </div>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                      {recognition.businessImpact}
                    </p>
                  </div>
                </ThemedCard>
              )}

              {/* Skills Demonstrated */}
              {recognition.skillsDemonstrated && recognition.skillsDemonstrated.length > 0 && (
                <ThemedCard padding="md">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Skills Demonstrated
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recognition.skillsDemonstrated.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{
                            backgroundColor: config.bgColor,
                            color: config.color
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </ThemedCard>
              )}

              {/* Rewards Given */}
              {recognition.rewardsGiven && recognition.rewardsGiven.length > 0 && (
                <ThemedCard padding="md">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Recognition Rewards
                      </span>
                    </div>
                    <div className="space-y-2">
                      {recognition.rewardsGiven.map((reward, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                          <span style={{ color: 'var(--color-text-primary)' }}>
                            {REWARD_TYPE_LABELS[reward] || reward}
                          </span>
                          {reward === 'monetary_bonus' && recognition.monetaryAmount && (
                            <span className="font-semibold" style={{ color: config.color }}>
                              R{recognition.monetaryAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ThemedCard>
              )}

              {/* Recognition Details */}
              <ThemedCard padding="md">
                <div className="grid grid-cols-2 gap-4">
                  {/* Recognition Date */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Recognition Date
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {formatDate(recognition.recognitionDate)}
                    </p>
                  </div>

                  {/* Recognized By */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Recognized By
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {recognition.recognizedByName}
                    </p>
                    {recognition.recognizedByRole && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {recognition.recognizedByRole}
                      </p>
                    )}
                  </div>

                  {/* Created At */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Record Created
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDateTime(recognition.createdAt)}
                    </p>
                  </div>

                  {/* Certificate Status */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Certificate
                      </span>
                    </div>
                    {recognition.certificateUrl ? (
                      <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                        Generated
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        Not generated
                      </p>
                    )}
                  </div>
                </div>
              </ThemedCard>

              {/* Private Notes (HR Only) */}
              {recognition.notes && (
                <ThemedCard padding="md">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
                        Private Notes (HR Only)
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {recognition.notes}
                    </p>
                  </div>
                </ThemedCard>
              )}
            </div>

            {/* Footer Actions */}
            <div
              className="flex items-center justify-between gap-3 p-6 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                {recognition.certificateUrl ? (
                  <button
                    onClick={handleDownloadCertificate}
                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    style={{
                      backgroundColor: config.color,
                      color: 'white'
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download Certificate
                  </button>
                ) : onGenerateCertificate && (
                  <button
                    onClick={handleGenerateCertificate}
                    disabled={generatingCertificate}
                    className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: config.color,
                      color: 'white'
                    }}
                  >
                    {generatingCertificate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Generate Certificate
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-lg font-medium border flex items-center gap-2 transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecognitionDetailsModal;
