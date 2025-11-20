// frontend/src/services/RecognitionPDFService.ts
// 🏆 RECOGNITION CERTIFICATE PDF GENERATION SERVICE
// ✅ Professional, printable certificates for employee recognition
// ✅ A4 format with elegant design suitable for framing
// ✅ Organization branding with custom colors and logos
// ✅ Comprehensive recognition details with business impact

import Logger from '../utils/logger';
import { globalDeviceCapabilities, getPerformanceLimits } from '../utils/deviceDetection';

/**
 * 🏆 RECOGNITION CERTIFICATE DATA INTERFACE
 * Comprehensive data structure for generating professional certificates
 */
export interface RecognitionCertificateData {
  // Core identifiers
  recognitionId: string;
  issuedDate: Date;
  achievementDate: Date;
  organizationId: string;

  // Employee information
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    position: string;
    email?: string;
    profilePhoto?: string; // Optional profile photo URL
  };

  // Recognition details
  recognitionType: 'achievement' | 'excellence' | 'innovation' | 'leadership' | 'service' | 'teamwork' | 'custom';
  achievementTitle: string;
  achievementDescription: string;
  businessImpact?: string; // Optional business impact statement

  // Skills and competencies
  skillsDemonstrated?: string[]; // Array of skills (e.g., ["Problem Solving", "Leadership"])

  // Recognition rewards
  rewards?: {
    monetaryBonus?: number;
    timeOff?: number; // Days
    giftCard?: string; // Description (e.g., "R500 Takealot Voucher")
    other?: string;
  };

  // Manager/Issuer information
  issuedBy: {
    name: string;
    title: string;
    signature?: string; // Base64 signature image
  };

  // Organization branding
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    registrationNumber?: string;
    branding?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
      logo?: string; // Base64 logo image
      companyName?: string;
      certificateSeal?: string; // Optional official seal image
    };
  };

  // Additional metadata
  additionalComments?: string;
  certificateNumber?: string; // Unique certificate number for tracking
}

/**
 * 🎨 RECOGNITION PDF GENERATION SERVICE
 * Creates professional, printable certificates for employee recognition
 */
export class RecognitionPDFService {

  /**
   * 🎯 MAIN CERTIFICATE GENERATION METHOD
   * Generates a professional A4 certificate suitable for printing and framing
   *
   * @param data - Recognition data to generate certificate from
   * @returns PDF blob
   */
  static async generateRecognitionCertificate(
    data: RecognitionCertificateData
  ): Promise<Blob> {
    try {
      const startTime = Date.now();
      Logger.debug('🏆 Starting recognition certificate generation:', {
        recognitionId: data.recognitionId,
        employee: `${data.employee.firstName} ${data.employee.lastName}`,
        type: data.recognitionType
      });

      // Dynamic import for jsPDF to reduce main bundle size
      const { default: jsPDF } = await import('jspdf');

      // A4 dimensions in mm (portrait orientation)
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);

      // Initialize PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      let currentY = margin;

      // ====================================
      // 1. DECORATIVE BORDER
      // ====================================
      currentY = this.addDecorativeBorder(doc, pageWidth, pageHeight, data.organization);

      // ====================================
      // 2. ORGANIZATION LOGO (CENTERED)
      // ====================================
      currentY = await this.addCenteredLogo(doc, data.organization, currentY, pageWidth, margin);

      // ====================================
      // 3. CERTIFICATE TITLE
      // ====================================
      currentY = this.addCertificateTitle(doc, currentY, pageWidth);

      // ====================================
      // 4. RECOGNITION TYPE BADGE
      // ====================================
      currentY = this.addRecognitionTypeBadge(doc, data.recognitionType, currentY, pageWidth);

      // ====================================
      // 5. "THIS CERTIFICATE IS AWARDED TO"
      // ====================================
      currentY = this.addAwardedToText(doc, currentY, pageWidth);

      // ====================================
      // 6. EMPLOYEE NAME (LARGE & PROMINENT)
      // ====================================
      currentY = this.addEmployeeName(doc, data.employee, currentY, pageWidth);

      // ====================================
      // 7. EMPLOYEE POSITION & DEPARTMENT
      // ====================================
      currentY = this.addEmployeeDetails(doc, data.employee, currentY, pageWidth);

      // ====================================
      // 8. "IN RECOGNITION OF"
      // ====================================
      currentY = this.addInRecognitionOfText(doc, currentY, pageWidth);

      // ====================================
      // 9. ACHIEVEMENT TITLE (BOLD & HIGHLIGHTED)
      // ====================================
      currentY = this.addAchievementTitle(doc, data.achievementTitle, currentY, pageWidth, margin, data.organization);

      // ====================================
      // 10. ACHIEVEMENT DESCRIPTION
      // ====================================
      currentY = this.addAchievementDescription(doc, data.achievementDescription, currentY, pageWidth, margin);

      // ====================================
      // 11. BUSINESS IMPACT (IF PROVIDED)
      // ====================================
      if (data.businessImpact) {
        currentY = this.addBusinessImpact(doc, data.businessImpact, currentY, pageWidth, margin, data.organization);
      }

      // ====================================
      // 12. SKILLS DEMONSTRATED
      // ====================================
      if (data.skillsDemonstrated && data.skillsDemonstrated.length > 0) {
        currentY = this.addSkillsTags(doc, data.skillsDemonstrated, currentY, pageWidth, margin, data.organization);
      }

      // ====================================
      // 13. RECOGNITION REWARDS
      // ====================================
      if (data.rewards) {
        currentY = this.addRecognitionRewards(doc, data.rewards, currentY, pageWidth, margin);
      }

      // ====================================
      // 14. ACHIEVEMENT DATE
      // ====================================
      currentY = this.addAchievementDate(doc, data.achievementDate, currentY, pageWidth);

      // ====================================
      // 15. SIGNATURE SECTION
      // ====================================
      currentY = await this.addSignatureSection(doc, data.issuedBy, data.issuedDate, currentY, pageWidth, margin, pageHeight);

      // ====================================
      // 16. ORGANIZATION SEAL (IF PROVIDED)
      // ====================================
      if (data.organization.branding?.certificateSeal) {
        await this.addOrganizationSeal(doc, data.organization.branding.certificateSeal, pageWidth, pageHeight, margin);
      }

      // ====================================
      // 17. FOOTER (CERTIFICATE NUMBER & METADATA)
      // ====================================
      this.addCertificateFooter(doc, data, pageWidth, pageHeight);

      // Generate and return blob
      const pdfBlob = doc.output('blob');
      const endTime = Date.now();

      Logger.success('✅ Recognition certificate generated successfully:', {
        recognitionId: data.recognitionId,
        employee: `${data.employee.firstName} ${data.employee.lastName}`,
        size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
        time: `${endTime - startTime}ms`
      });

      return pdfBlob;

    } catch (error) {
      Logger.error('❌ Recognition certificate generation failed:', error);
      throw new Error(`Certificate generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // SECTION BUILDERS - PROFESSIONAL CERTIFICATE DESIGN
  // ============================================

  /**
   * 🎨 Decorative Border - Elegant frame around certificate
   */
  private static addDecorativeBorder(
    doc: any,
    pageWidth: number,
    pageHeight: number,
    organization: RecognitionCertificateData['organization']
  ): number {
    const primaryColor = this.parseColor(organization.branding?.colors?.primary) || { r: 22, g: 163, b: 74 }; // Green default
    const accentColor = this.parseColor(organization.branding?.colors?.accent) || { r: 245, g: 158, b: 11 }; // Orange accent

    // Outer border (thick, primary color)
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner border (thin, accent color)
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Corner decorations (small squares in corners)
    const cornerSize = 5;
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);

    // Top-left
    doc.rect(15, 15, cornerSize, cornerSize, 'F');
    // Top-right
    doc.rect(pageWidth - 20, 15, cornerSize, cornerSize, 'F');
    // Bottom-left
    doc.rect(15, pageHeight - 20, cornerSize, cornerSize, 'F');
    // Bottom-right
    doc.rect(pageWidth - 20, pageHeight - 20, cornerSize, cornerSize, 'F');

    return 25; // Start content below border
  }

  /**
   * 🏢 Centered Organization Logo
   */
  private static async addCenteredLogo(
    doc: any,
    organization: RecognitionCertificateData['organization'],
    startY: number,
    pageWidth: number,
    margin: number
  ): Promise<number> {
    if (organization.branding?.logo) {
      try {
        const logoHeight = 25;
        const logoWidth = 40; // Approximate width
        const logoX = (pageWidth - logoWidth) / 2; // Center horizontally

        doc.addImage(organization.branding.logo, 'PNG', logoX, startY, logoWidth, logoHeight);
        Logger.debug('Added organization logo to certificate');

        return startY + logoHeight + 10; // Space after logo
      } catch (error) {
        Logger.warn('Failed to add organization logo to certificate:', error);
        return startY;
      }
    }

    return startY;
  }

  /**
   * 🏆 Certificate Title
   */
  private static addCertificateTitle(
    doc: any,
    startY: number,
    pageWidth: number
  ): number {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');

    const title = 'CERTIFICATE OF RECOGNITION';
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;

    doc.text(title, titleX, startY);

    return startY + 12;
  }

  /**
   * 🏅 Recognition Type Badge
   */
  private static addRecognitionTypeBadge(
    doc: any,
    recognitionType: string,
    startY: number,
    pageWidth: number
  ): number {
    // Badge background
    const badgeText = this.getRecognitionTypeLabel(recognitionType);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const badgeWidth = doc.getTextWidth(badgeText) + 20;
    const badgeHeight = 8;
    const badgeX = (pageWidth - badgeWidth) / 2;

    // Badge styling based on type
    const badgeColor = this.getRecognitionTypeColor(recognitionType);
    doc.setFillColor(badgeColor.r, badgeColor.g, badgeColor.b);
    doc.roundedRect(badgeX, startY - 5, badgeWidth, badgeHeight, 2, 2, 'F');

    // Badge text
    doc.setTextColor(255, 255, 255);
    const textX = (pageWidth - doc.getTextWidth(badgeText)) / 2;
    doc.text(badgeText, textX, startY);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 15;
  }

  /**
   * 📝 "This Certificate is Awarded To" Text
   */
  private static addAwardedToText(
    doc: any,
    startY: number,
    pageWidth: number
  ): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);

    const text = 'This certificate is awarded to';
    const textWidth = doc.getTextWidth(text);
    const textX = (pageWidth - textWidth) / 2;

    doc.text(text, textX, startY);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 10;
  }

  /**
   * 👤 Employee Name (Large & Prominent)
   */
  private static addEmployeeName(
    doc: any,
    employee: RecognitionCertificateData['employee'],
    startY: number,
    pageWidth: number
  ): number {
    const fullName = `${employee.firstName} ${employee.lastName}`.toUpperCase();

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Green for emphasis

    const nameWidth = doc.getTextWidth(fullName);
    const nameX = (pageWidth - nameWidth) / 2;

    // Underline the name
    doc.text(fullName, nameX, startY);
    doc.setLineWidth(0.8);
    doc.line(nameX, startY + 2, nameX + nameWidth, startY + 2);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 10;
  }

  /**
   * 💼 Employee Position & Department
   */
  private static addEmployeeDetails(
    doc: any,
    employee: RecognitionCertificateData['employee'],
    startY: number,
    pageWidth: number
  ): number {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const details = `${employee.position} | ${employee.department}`;
    const detailsWidth = doc.getTextWidth(details);
    const detailsX = (pageWidth - detailsWidth) / 2;

    doc.text(details, detailsX, startY);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 15;
  }

  /**
   * 🎖️ "In Recognition Of" Text
   */
  private static addInRecognitionOfText(
    doc: any,
    startY: number,
    pageWidth: number
  ): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);

    const text = 'in recognition of';
    const textWidth = doc.getTextWidth(text);
    const textX = (pageWidth - textWidth) / 2;

    doc.text(text, textX, startY);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 8;
  }

  /**
   * ✨ Achievement Title (Bold & Highlighted)
   */
  private static addAchievementTitle(
    doc: any,
    title: string,
    startY: number,
    pageWidth: number,
    margin: number,
    organization: RecognitionCertificateData['organization']
  ): number {
    const accentColor = this.parseColor(organization.branding?.colors?.accent) || { r: 245, g: 158, b: 11 };

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    // Wrap text if too long
    const maxWidth = pageWidth - (2 * margin) - 20;
    const lines = doc.splitTextToSize(title, maxWidth);

    // Highlight background
    const lineHeight = 7;
    const totalHeight = lines.length * lineHeight + 4;
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b, 0.2); // Semi-transparent
    doc.rect(margin + 10, startY - 6, pageWidth - (2 * margin) - 20, totalHeight, 'F');

    // Text
    lines.forEach((line: string, index: number) => {
      const lineWidth = doc.getTextWidth(line);
      const lineX = (pageWidth - lineWidth) / 2;
      doc.text(line, lineX, startY + (index * lineHeight));
    });

    return startY + (lines.length * lineHeight) + 10;
  }

  /**
   * 📖 Achievement Description
   */
  private static addAchievementDescription(
    doc: any,
    description: string,
    startY: number,
    pageWidth: number,
    margin: number
  ): number {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const maxWidth = pageWidth - (2 * margin) - 10;
    const lines = doc.splitTextToSize(description, maxWidth);
    const lineHeight = 6;

    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + 5, startY + (index * lineHeight));
    });

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + (lines.length * lineHeight) + 10;
  }

  /**
   * 💼 Business Impact (Highlighted Section)
   */
  private static addBusinessImpact(
    doc: any,
    impact: string,
    startY: number,
    pageWidth: number,
    margin: number,
    organization: RecognitionCertificateData['organization']
  ): number {
    const primaryColor = this.parseColor(organization.branding?.colors?.primary) || { r: 22, g: 163, b: 74 };

    // Section heading
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text('Business Impact:', margin + 5, startY);

    startY += 7;

    // Impact text in box
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(40, 40, 40);

    const maxWidth = pageWidth - (2 * margin) - 20;
    const lines = doc.splitTextToSize(impact, maxWidth);
    const lineHeight = 5.5;
    const boxHeight = (lines.length * lineHeight) + 6;

    // Light green background box
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b, 0.1);
    doc.roundedRect(margin + 5, startY - 4, pageWidth - (2 * margin) - 10, boxHeight, 2, 2, 'F');

    // Border
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + 5, startY - 4, pageWidth - (2 * margin) - 10, boxHeight, 2, 2, 'S');

    // Text
    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + 10, startY + (index * lineHeight));
    });

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + boxHeight + 8;
  }

  /**
   * 🏷️ Skills Tags (Visual tag list)
   */
  private static addSkillsTags(
    doc: any,
    skills: string[],
    startY: number,
    pageWidth: number,
    margin: number,
    organization: RecognitionCertificateData['organization']
  ): number {
    const primaryColor = this.parseColor(organization.branding?.colors?.primary) || { r: 22, g: 163, b: 74 };

    // Section heading
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Skills Demonstrated:', margin + 5, startY);

    startY += 7;

    // Draw tags
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    let currentX = margin + 5;
    const tagHeight = 6;
    const tagPadding = 8;
    const tagSpacing = 4;
    const maxWidth = pageWidth - (2 * margin) - 10;

    skills.forEach((skill, index) => {
      const tagWidth = doc.getTextWidth(skill) + tagPadding;

      // Move to next line if tag doesn't fit
      if (currentX + tagWidth > margin + maxWidth) {
        currentX = margin + 5;
        startY += tagHeight + 3;
      }

      // Tag background
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b, 0.2);
      doc.roundedRect(currentX, startY - 4, tagWidth, tagHeight, 1.5, 1.5, 'F');

      // Tag border
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(0.2);
      doc.roundedRect(currentX, startY - 4, tagWidth, tagHeight, 1.5, 1.5, 'S');

      // Tag text
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text(skill, currentX + (tagPadding / 2), startY);

      currentX += tagWidth + tagSpacing;
    });

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 12;
  }

  /**
   * 🎁 Recognition Rewards
   */
  private static addRecognitionRewards(
    doc: any,
    rewards: RecognitionCertificateData['rewards'],
    startY: number,
    pageWidth: number,
    margin: number
  ): number {
    // Section heading
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Recognition Given:', margin + 5, startY);

    startY += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const rewardsList: string[] = [];

    if (rewards.monetaryBonus) {
      rewardsList.push(`• Monetary Bonus: R${rewards.monetaryBonus.toLocaleString()}`);
    }

    if (rewards.timeOff) {
      rewardsList.push(`• Additional Time Off: ${rewards.timeOff} day${rewards.timeOff > 1 ? 's' : ''}`);
    }

    if (rewards.giftCard) {
      rewardsList.push(`• Gift Card: ${rewards.giftCard}`);
    }

    if (rewards.other) {
      rewardsList.push(`• ${rewards.other}`);
    }

    const lineHeight = 5.5;
    rewardsList.forEach((reward, index) => {
      doc.text(reward, margin + 10, startY + (index * lineHeight));
    });

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + (rewardsList.length * lineHeight) + 10;
  }

  /**
   * 📅 Achievement Date
   */
  private static addAchievementDate(
    doc: any,
    achievementDate: Date,
    startY: number,
    pageWidth: number
  ): number {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);

    const dateText = `Achievement Date: ${this.formatDate(achievementDate)}`;
    const dateWidth = doc.getTextWidth(dateText);
    const dateX = (pageWidth - dateWidth) / 2;

    doc.text(dateText, dateX, startY);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 15;
  }

  /**
   * ✍️ Signature Section
   */
  private static async addSignatureSection(
    doc: any,
    issuedBy: RecognitionCertificateData['issuedBy'],
    issuedDate: Date,
    startY: number,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): Promise<number> {
    // Ensure we're not too close to bottom
    const minBottomSpace = 50;
    if (startY > pageHeight - minBottomSpace) {
      startY = pageHeight - minBottomSpace;
    }

    const signatureWidth = 70;
    const signatureX = (pageWidth - signatureWidth) / 2;

    // Signature image (if provided)
    if (issuedBy.signature) {
      try {
        const signatureHeight = 20;
        doc.addImage(issuedBy.signature, 'PNG', signatureX, startY, signatureWidth, signatureHeight);
        startY += signatureHeight + 2;
      } catch (error) {
        Logger.warn('Failed to add signature to certificate:', error);
        startY += 15; // Space for manual signature
      }
    } else {
      startY += 15; // Space for manual signature
    }

    // Signature line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(signatureX, startY, signatureX + signatureWidth, startY);

    startY += 5;

    // Manager name and title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    const nameWidth = doc.getTextWidth(issuedBy.name);
    const nameX = (pageWidth - nameWidth) / 2;
    doc.text(issuedBy.name, nameX, startY);

    startY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const titleWidth = doc.getTextWidth(issuedBy.title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(issuedBy.title, titleX, startY);

    startY += 6;

    // Issue date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const dateText = `Date Issued: ${this.formatDate(issuedDate)}`;
    const dateWidth = doc.getTextWidth(dateText);
    const dateX = (pageWidth - dateWidth) / 2;
    doc.text(dateText, dateX, startY);

    doc.setTextColor(0, 0, 0); // Reset to black
    return startY + 10;
  }

  /**
   * 🏛️ Organization Seal (Bottom Right)
   */
  private static async addOrganizationSeal(
    doc: any,
    sealImage: string,
    pageWidth: number,
    pageHeight: number,
    margin: number
  ): Promise<void> {
    try {
      const sealSize = 30;
      const sealX = pageWidth - margin - sealSize - 10;
      const sealY = pageHeight - margin - sealSize - 10;

      doc.addImage(sealImage, 'PNG', sealX, sealY, sealSize, sealSize);
      Logger.debug('Added organization seal to certificate');
    } catch (error) {
      Logger.warn('Failed to add organization seal to certificate:', error);
    }
  }

  /**
   * 🦶 Certificate Footer
   */
  private static addCertificateFooter(
    doc: any,
    data: RecognitionCertificateData,
    pageWidth: number,
    pageHeight: number
  ): void {
    const footerY = pageHeight - 18;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);

    // Certificate number (left)
    if (data.certificateNumber) {
      doc.text(`Certificate No: ${data.certificateNumber}`, 15, footerY);
    }

    // System name (center)
    const systemText = 'Generated by HR Disciplinary System';
    const systemWidth = doc.getTextWidth(systemText);
    const systemX = (pageWidth - systemWidth) / 2;
    doc.text(systemText, systemX, footerY);

    // Recognition ID (right)
    const idText = `ID: ${data.recognitionId.substring(0, 12)}`;
    const idWidth = doc.getTextWidth(idText);
    doc.text(idText, pageWidth - 15 - idWidth, footerY);

    // Generation date
    const genDate = `Generated: ${this.formatDate(new Date())}`;
    const genWidth = doc.getTextWidth(genDate);
    const genX = (pageWidth - genWidth) / 2;
    doc.text(genDate, genX, footerY + 4);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get human-readable label for recognition type
   */
  private static getRecognitionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'achievement': 'OUTSTANDING ACHIEVEMENT',
      'excellence': 'EXCELLENCE IN PERFORMANCE',
      'innovation': 'INNOVATION & CREATIVITY',
      'leadership': 'LEADERSHIP EXCELLENCE',
      'service': 'YEARS OF SERVICE',
      'teamwork': 'EXCEPTIONAL TEAMWORK',
      'custom': 'SPECIAL RECOGNITION'
    };

    return labels[type] || 'RECOGNITION';
  }

  /**
   * Get color for recognition type badge
   */
  private static getRecognitionTypeColor(type: string): { r: number; g: number; b: number } {
    const colors: Record<string, { r: number; g: number; b: number }> = {
      'achievement': { r: 245, g: 158, b: 11 },  // Orange
      'excellence': { r: 139, g: 92, b: 246 },   // Purple
      'innovation': { r: 59, g: 130, b: 246 },   // Blue
      'leadership': { r: 236, g: 72, b: 153 },   // Pink
      'service': { r: 22, g: 163, b: 74 },       // Green
      'teamwork': { r: 34, g: 197, b: 94 },      // Light Green
      'custom': { r: 107, g: 114, b: 128 }       // Gray
    };

    return colors[type] || { r: 107, g: 114, b: 128 };
  }

  /**
   * Parse color string to RGB object
   */
  private static parseColor(colorString: string | undefined): { r: number; g: number; b: number } | null {
    if (!colorString) return null;

    // Handle hex colors (#RRGGBB)
    if (colorString.startsWith('#')) {
      const hex = colorString.substring(1);
      if (hex.length === 6) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16)
        };
      }
    }

    return null;
  }

  /**
   * Format date to readable string
   */
  private static formatDate(date: Date | string): string {
    if (!date) return 'Date not available';

    try {
      const d = typeof date === 'string' ? new Date(date) : date;

      // Format: "15 November 2025"
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'long' });
      const year = d.getFullYear();

      return `${day} ${month} ${year}`;
    } catch (error) {
      Logger.warn('Date formatting failed:', error);
      return 'Date not available';
    }
  }

  /**
   * 🎉 CONVENIENCE METHOD: Download Certificate
   * Automatically downloads the generated certificate with a friendly filename
   */
  static async downloadCertificate(data: RecognitionCertificateData): Promise<void> {
    try {
      const pdfBlob = await this.generateRecognitionCertificate(data);

      // Create filename: "Certificate_JohnDoe_2025-11-12.pdf"
      const employeeName = `${data.employee.firstName}${data.employee.lastName}`;
      const date = new Date().toISOString().split('T')[0];
      const filename = `Certificate_${employeeName}_${date}.pdf`;

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Logger.success(`✅ Certificate downloaded: ${filename}`);
    } catch (error) {
      Logger.error('❌ Certificate download failed:', error);
      throw error;
    }
  }

  /**
   * 📧 CONVENIENCE METHOD: Email Certificate
   * Generates certificate and prepares it for email delivery
   * Note: Actual email sending would require backend integration
   */
  static async prepareCertificateForEmail(data: RecognitionCertificateData): Promise<{ blob: Blob; filename: string }> {
    const pdfBlob = await this.generateRecognitionCertificate(data);

    const employeeName = `${data.employee.firstName}${data.employee.lastName}`;
    const date = new Date().toISOString().split('T')[0];
    const filename = `Certificate_${employeeName}_${date}.pdf`;

    return { blob: pdfBlob, filename };
  }
}
