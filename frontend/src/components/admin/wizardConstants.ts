// frontend/src/components/admin/wizardConstants.ts
//
// Constants + types for EnhancedOrganizationWizard. Extracted in Phase 2
// Tier 3D step 6. Zero behaviour change — pure relocation.

import type { WarningLevel } from '../../types/core';
import { UNIVERSAL_SA_CATEGORIES } from '../../services/UniversalCategories';

export interface OrganizationCategory {
  id: string;
  name: string;
  description: string;
  level: WarningLevel;
  color: string;
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  escalationPath?: WarningLevel[];
}

/** Convert universal SA categories into the wizard's OrganizationCategory shape. */
export const getDefaultCategories = (): OrganizationCategory[] => {
  const severityColors = {
    minor: '#10b981',         // green
    serious: '#f59e0b',       // amber
    gross_misconduct: '#ef4444', // red
  };

  return UNIVERSAL_SA_CATEGORIES.map((universalCat) => ({
    id: universalCat.id,
    name: universalCat.name,
    description: universalCat.description,
    icon: universalCat.icon,
    level: universalCat.escalationPath[0] || 'verbal',
    color: severityColors[universalCat.severity as keyof typeof severityColors],
    isActive: true,
    isDefault: true,
    escalationPath: universalCat.escalationPath,
  }));
};

/** Warning level display names — used throughout the wizard. */
export const WARNING_LEVEL_NAMES: Record<WarningLevel, string> = {
  counselling: 'Counselling',
  verbal: 'Verbal Warning',
  first_written: 'Written Warning',
  second_written: 'Second Written Warning',
  final_written: 'Final Written Warning',
  dismissal: 'Contact HR - Serious Offence',
};

/** Industry/Sector options organized by category — used in step 1 of the wizard. */
export const INDUSTRY_OPTIONS = [
  { group: 'Primary Industries', options: [
    { value: 'agriculture', label: 'Agriculture & Farming' },
    { value: 'mining', label: 'Mining & Quarrying' },
    { value: 'forestry', label: 'Forestry & Logging' },
    { value: 'fishing', label: 'Fishing & Aquaculture' },
  ]},
  { group: 'Manufacturing & Production', options: [
    { value: 'manufacturing', label: 'Manufacturing (General)' },
    { value: 'food-processing', label: 'Food & Beverage Processing' },
    { value: 'textiles', label: 'Textiles & Clothing' },
    { value: 'automotive', label: 'Automotive Manufacturing' },
    { value: 'pharmaceuticals', label: 'Pharmaceuticals & Medical Devices' },
    { value: 'chemicals', label: 'Chemicals & Plastics' },
    { value: 'electronics', label: 'Electronics & Technology Manufacturing' },
    { value: 'construction-materials', label: 'Construction Materials' },
  ]},
  { group: 'Construction & Engineering', options: [
    { value: 'construction', label: 'Construction & Building' },
    { value: 'civil-engineering', label: 'Civil Engineering' },
    { value: 'electrical-engineering', label: 'Electrical Engineering' },
    { value: 'mechanical-engineering', label: 'Mechanical Engineering' },
    { value: 'architecture', label: 'Architecture & Design' },
  ]},
  { group: 'Retail & Wholesale', options: [
    { value: 'retail', label: 'Retail & Commerce (General)' },
    { value: 'wholesale', label: 'Wholesale & Distribution' },
    { value: 'supermarkets', label: 'Supermarkets & Grocery' },
    { value: 'fashion-retail', label: 'Fashion & Apparel Retail' },
    { value: 'automotive-retail', label: 'Automotive Sales & Service' },
    { value: 'furniture-retail', label: 'Furniture & Home Goods' },
    { value: 'electronics-retail', label: 'Electronics & Appliances Retail' },
  ]},
  { group: 'Hospitality & Tourism', options: [
    { value: 'hospitality', label: 'Hospitality & Tourism' },
    { value: 'hotels', label: 'Hotels & Accommodation' },
    { value: 'restaurants', label: 'Restaurants & Food Service' },
    { value: 'travel-agencies', label: 'Travel Agencies & Tour Operators' },
    { value: 'entertainment', label: 'Entertainment & Recreation' },
  ]},
  { group: 'Healthcare & Social Services', options: [
    { value: 'healthcare', label: 'Healthcare (General)' },
    { value: 'hospitals', label: 'Hospitals & Clinics' },
    { value: 'nursing-homes', label: 'Nursing Homes & Elderly Care' },
    { value: 'medical-practices', label: 'Medical Practices & Specialists' },
    { value: 'veterinary', label: 'Veterinary Services' },
    { value: 'social-services', label: 'Social Services & NGOs' },
  ]},
  { group: 'Education & Training', options: [
    { value: 'education', label: 'Education & Training' },
    { value: 'schools', label: 'Schools & Colleges' },
    { value: 'universities', label: 'Universities & Higher Education' },
    { value: 'vocational-training', label: 'Vocational & Skills Training' },
    { value: 'childcare', label: 'Childcare & Early Learning' },
  ]},
  { group: 'Financial Services', options: [
    { value: 'banking', label: 'Banking & Financial Services' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'investment', label: 'Investment & Asset Management' },
    { value: 'accounting', label: 'Accounting & Auditing' },
    { value: 'real-estate', label: 'Real Estate & Property Management' },
  ]},
  { group: 'Professional Services', options: [
    { value: 'legal', label: 'Legal Services' },
    { value: 'consulting', label: 'Consulting & Advisory' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'hr-recruitment', label: 'HR & Recruitment' },
    { value: 'business-services', label: 'Business Support Services' },
  ]},
  { group: 'Technology & Communications', options: [
    { value: 'it-services', label: 'IT Services & Software' },
    { value: 'telecommunications', label: 'Telecommunications' },
    { value: 'media', label: 'Media & Broadcasting' },
    { value: 'publishing', label: 'Publishing & Printing' },
    { value: 'data-centers', label: 'Data Centers & Cloud Services' },
  ]},
  { group: 'Transportation & Logistics', options: [
    { value: 'logistics', label: 'Logistics & Supply Chain' },
    { value: 'transportation', label: 'Transportation & Freight' },
    { value: 'warehousing', label: 'Warehousing & Storage' },
    { value: 'courier', label: 'Courier & Postal Services' },
    { value: 'aviation', label: 'Aviation & Airports' },
    { value: 'maritime', label: 'Maritime & Shipping' },
  ]},
  { group: 'Energy & Utilities', options: [
    { value: 'energy', label: 'Energy & Power Generation' },
    { value: 'renewable-energy', label: 'Renewable Energy' },
    { value: 'water-utilities', label: 'Water & Sanitation' },
    { value: 'waste-management', label: 'Waste Management & Recycling' },
  ]},
  { group: 'Security & Emergency Services', options: [
    { value: 'security', label: 'Security Services' },
    { value: 'private-security', label: 'Private Security & Guarding' },
    { value: 'emergency-services', label: 'Emergency Services' },
    { value: 'fire-safety', label: 'Fire Safety & Protection' },
  ]},
  { group: 'Government & Public Sector', options: [
    { value: 'government', label: 'Government & Public Administration' },
    { value: 'municipal', label: 'Municipal Services' },
    { value: 'public-utilities', label: 'Public Utilities' },
  ]},
  { group: 'Other', options: [
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'beauty-wellness', label: 'Beauty & Wellness' },
    { value: 'cleaning', label: 'Cleaning & Facilities Management' },
    { value: 'maintenance', label: 'Maintenance & Repair Services' },
    { value: 'other', label: 'Other Industry' },
  ]},
];
