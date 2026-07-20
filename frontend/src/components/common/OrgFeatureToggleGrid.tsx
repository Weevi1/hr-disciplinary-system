// frontend/src/components/common/OrgFeatureToggleGrid.tsx
// Shared toggle grid for per-organization feature flags.
// Used by the super-user OrganizationFeaturesModal and the reseller ClientOrganizationManager.

import React from 'react';
import { Check, X } from 'lucide-react';
import {
  ORG_FEATURES,
  DEFAULT_ORG_FEATURES,
  type OrgFeatureKey
} from '../../constants/orgFeatures';

interface OrgFeatureToggleGridProps {
  value: Record<OrgFeatureKey, boolean>;
  onChange: (next: Record<OrgFeatureKey, boolean>) => void;
  disabled?: boolean;
}

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-600', border: 'border-orange-200' },
    green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600', border: 'border-red-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600', border: 'border-blue-200' }
  };
  return colors[color] || colors.blue;
};

export const OrgFeatureToggleGrid: React.FC<OrgFeatureToggleGridProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const enabledCount = ORG_FEATURES.filter(f => value[f.key]).length;
  const allEnabled = enabledCount === ORG_FEATURES.length;
  const noneEnabled = enabledCount === 0;

  const toggle = (key: OrgFeatureKey) => {
    onChange({ ...value, [key]: !value[key] });
  };

  const setAll = (enabled: boolean) => {
    const next = { ...DEFAULT_ORG_FEATURES };
    (Object.keys(next) as OrgFeatureKey[]).forEach(k => { next[k] = enabled; });
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
        Organization Features ({enabledCount}/{ORG_FEATURES.length} enabled)
      </h4>

      {ORG_FEATURES.map((feature) => {
        const isEnabled = value[feature.key];
        const colors = getColorClasses(feature.color);
        const Icon = feature.icon;

        return (
          <button
            key={feature.key}
            type="button"
            onClick={() => toggle(feature.key)}
            disabled={disabled}
            className={`
              w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all
              ${isEnabled
                ? `${colors.bg} ${colors.border}`
                : 'bg-gray-50 border-gray-200 opacity-60'
              }
              hover:shadow-md disabled:cursor-not-allowed
            `}
          >
            <div className={`
              flex-shrink-0 p-2 rounded-lg
              ${isEnabled ? 'bg-white shadow-sm' : 'bg-gray-100'}
              ${isEnabled ? colors.icon : 'text-gray-400'}
            `}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${isEnabled ? colors.text : 'text-gray-500'}`}>
                  {feature.label}
                </span>
              </div>
              <p className={`text-sm ${isEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                {feature.description}
              </p>
            </div>

            <div className={`
              flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
              ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}
            `}>
              {isEnabled ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <X className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </button>
        );
      })}

      <div className="flex gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={() => setAll(true)}
          disabled={disabled || allEnabled}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enable All
        </button>
        <button
          type="button"
          onClick={() => setAll(false)}
          disabled={disabled || noneEnabled}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Disable All
        </button>
      </div>
    </div>
  );
};
