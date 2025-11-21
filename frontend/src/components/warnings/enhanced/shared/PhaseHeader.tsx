// PhaseHeader.tsx - Header for each phase showing title and context
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PhaseHeaderProps {
  title: string;
  icon: LucideIcon;
  phaseNumber: number;
  totalPhases: number;
  // Quick reference context
  employeeName?: string;
  incidentDate?: string;
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({
  title,
  icon: Icon,
  phaseNumber,
  totalPhases,
  employeeName,
  incidentDate
}) => {
  return (
    <div className="mb-4">
      {/* Quick reference bar */}
      {(employeeName || incidentDate) && (
        <div
          className="flex items-center gap-3 text-xs mb-3 pb-3 border-b"
          style={{
            color: 'var(--color-text-secondary)',
            borderColor: 'var(--color-border)'
          }}
        >
          {employeeName && (
            <span><strong>Employee:</strong> {employeeName}</span>
          )}
          {incidentDate && (
            <span><strong>Date:</strong> {incidentDate}</span>
          )}
        </div>
      )}

      {/* Phase header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <Icon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="flex-1">
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </h3>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Phase {phaseNumber} of {totalPhases}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhaseHeader;
