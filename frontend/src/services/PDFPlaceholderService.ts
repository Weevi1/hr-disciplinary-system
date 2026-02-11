// frontend/src/services/PDFPlaceholderService.ts
// 🔄 PDF PLACEHOLDER REPLACEMENT SERVICE
// ✅ Replaces {{placeholders}} with actual data from warnings
// ✅ Supports employee, warning, organization, and manager fields
// ✅ Graceful handling of missing data

import type { WarningPDFData } from './PDFGenerationService';
import { getLevelLabel } from './UniversalCategories';

/**
 * 🔄 PLACEHOLDER REPLACEMENT SERVICE
 *
 * This service handles the replacement of {{placeholder}} syntax with actual
 * data from the warning. Used by the dynamic section renderer to populate
 * custom fields in PDF sections.
 *
 * Supported placeholders:
 * - {{employee.firstName}} → Employee's first name
 * - {{employee.lastName}} → Employee's last name
 * - {{employee.employeeNumber}} → Employee ID
 * - {{employee.email}} → Employee email
 * - {{employee.phoneNumber}} → Employee phone
 * - {{employee.department}} → Department name
 * - {{employee.position}} → Job title
 * - {{warning.level}} → Warning level (e.g., "Written Warning")
 * - {{warning.issueDate}} → Date warning was issued
 * - {{warning.incidentDate}} → Date of incident
 * - {{warning.category}} → Warning category
 * - {{warning.description}} → Incident description
 * - {{warning.nextLevel}} → Next escalation level
 * - {{organization.name}} → Company name
 * - {{organization.industry}} → Industry sector
 * - {{manager.name}} → Manager's full name
 * - {{manager.position}} → Manager's job title
 */
export class PDFPlaceholderService {
  /**
   * Replace all placeholders in a template string with actual data
   *
   * @param template - Template string with {{placeholders}}
   * @param data - Warning PDF data containing actual values
   * @returns String with placeholders replaced by actual values
   */
  static replacePlaceholders(template: string, data: WarningPDFData): string {
    if (!template) return '';

    let result = template;

    // Find all {{placeholder}} patterns
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = template.matchAll(placeholderRegex);

    for (const match of matches) {
      const placeholder = match[1].trim(); // e.g., "employee.firstName"
      const value = this.getValueFromPath(placeholder, data);

      // Replace placeholder with actual value
      result = result.replace(match[0], value || `[${placeholder}]`);
    }

    return result;
  }

  /**
   * Get value from nested object path
   *
   * @param path - Dot-notation path (e.g., "employee.firstName")
   * @param data - Warning PDF data object
   * @returns Value at path, or empty string if not found
   */
  private static getValueFromPath(path: string, data: WarningPDFData): string {
    const parts = path.split('.');

    try {
      // Employee fields
      if (parts[0] === 'employee') {
        switch (parts[1]) {
          case 'firstName':
            return data.employee?.firstName || '';
          case 'lastName':
            return data.employee?.lastName || '';
          case 'employeeNumber':
            return data.employee?.employeeNumber || '';
          case 'email':
            return data.employee?.email || '';
          case 'phoneNumber':
          case 'phone':
            return data.employee?.phone || '';
          case 'department':
            return data.employee?.department || '';
          case 'position':
            return data.employee?.position || '';
          default:
            return '';
        }
      }

      // Warning fields
      if (parts[0] === 'warning') {
        switch (parts[1]) {
          case 'level':
            return this.formatWarningLevel(data.warningLevel);
          case 'issueDate':
            return this.formatDate(data.issuedDate);
          case 'incidentDate':
            return this.formatDate(data.incidentDate);
          case 'category':
            return data.category || '';
          case 'description':
            return data.description || '';
          case 'nextLevel':
            return this.getNextEscalationLevel(data.warningLevel);
          default:
            return '';
        }
      }

      // Organization fields
      if (parts[0] === 'organization') {
        switch (parts[1]) {
          case 'name':
            return data.organization?.name || '';
          case 'industry':
            return this.formatIndustry(data.organization);
          default:
            return '';
        }
      }

      // Manager fields
      if (parts[0] === 'manager') {
        switch (parts[1]) {
          case 'name':
            return data.issuedByName || 'Management';
          case 'position':
            // Try to get from organization context if available
            return 'Manager'; // Default - could be enhanced with actual position data
          default:
            return '';
        }
      }

      return '';

    } catch (error) {
      console.warn(`Failed to resolve placeholder: ${path}`, error);
      return '';
    }
  }

  /**
   * Format warning level for display
   */
  private static formatWarningLevel(level: string): string {
    return getLevelLabel(level);
  }

  /**
   * Get next escalation level in progressive discipline
   */
  private static getNextEscalationLevel(currentLevel: string): string {
    const escalationPath: Record<string, string> = {
      'counselling': 'Verbal Warning',
      'verbal': 'Written Warning',
      'first_written': 'Second Written Warning',
      'second_written': 'Final Written Warning',
      'final_written': 'Contact HR - Serious Offence',
      'dismissal': 'Termination of Employment'
    };

    return escalationPath[currentLevel] || 'Further Disciplinary Action';
  }

  /**
   * Format date for display (DD MMM YYYY format)
   */
  private static formatDate(date: Date | string | undefined): string {
    if (!date) return '';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      const day = dateObj.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();

      return `${day} ${month} ${year}`;
    } catch (error) {
      console.warn('Failed to format date:', date, error);
      return '';
    }
  }

  /**
   * Format industry name for display
   */
  private static formatIndustry(organization: any): string {
    if (!organization) return '';

    const industryMap: Record<string, string> = {
      'manufacturing': 'Manufacturing',
      'retail': 'Retail',
      'healthcare': 'Healthcare',
      'security': 'Security Services',
      'mining': 'Mining'
    };

    // Try to get from branding first, then fallback to direct property
    const industry = organization.branding?.industry || organization.industry;
    return industryMap[industry] || industry || '';
  }

  /**
   * Replace placeholders in an array of strings (for bullet points)
   */
  static replacePlaceholdersInArray(templates: string[], data: WarningPDFData): string[] {
    return templates.map(template => this.replacePlaceholders(template, data));
  }

  /**
   * Check if a string contains any unresolved placeholders
   * Useful for validation before rendering
   */
  static hasUnresolvedPlaceholders(text: string): boolean {
    return /\{\{[^}]+\}\}/.test(text);
  }

  /**
   * Extract all placeholder names from a template string
   * Useful for validation and debugging
   */
  static extractPlaceholders(template: string): string[] {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const matches = Array.from(template.matchAll(placeholderRegex));
    return matches.map(match => match[1].trim());
  }
}

// Re-export WarningPDFData type for convenience
export type { WarningPDFData };
