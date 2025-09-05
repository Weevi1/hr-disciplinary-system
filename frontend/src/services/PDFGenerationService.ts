// frontend/src/services/PDFGenerationService.ts
// 🏆 REBUILT PDF GENERATION SERVICE - PERFECTLY MATCHED TO WARNING WIZARD DATA
// ✅ Built for your actual collected fields: incidentDate, incidentTime, incidentLocation, etc.
// ✅ Professional LRA-compliant document generation with proper formatting
// ✅ Supports signatures, recommendations, and all your form data
// ✅ RESILIENT to incomplete data states

import jsPDF from 'jspdf';

// ============================================
// INTERFACES MATCHING YOUR WARNING WIZARD DATA
// ============================================

interface WarningPDFData {
  // Core identifiers
  warningId: string;
  issuedDate: Date;
  organizationId?: string;
  
  // Employee information (from selectedEmployee)
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    position: string;
    email?: string;
    phone?: string;
  };
  
  // Warning classification
  warningLevel: string;
  category: string;
  
  // Incident details (from your formData)
  incidentDate: Date;
  incidentTime: string;
  incidentLocation: string;
  description: string;
  
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
      };
      logo?: string;
    };
  };
  
  // Optional sections
  signatures?: {
    manager?: string | null;
    employee?: string | null;
  };
  
  additionalNotes?: string;
  validityPeriod?: number;
  
  // AI/LRA recommendation data
  disciplineRecommendation?: {
    suggestedLevel: string;
    reason: string;
    warningCount: number;
    activeWarnings: any[];
    legalRequirements: string[];
  };
  
  // Legal compliance
  legalCompliance?: {
    isCompliant: boolean;
    framework: string;
    requirements: string[];
  };
  
  // Delivery information
  deliveryChoice?: {
    method: string;
    timestamp: Date;
    chosenBy: string;
    contactDetails?: any;
  };
}

// ============================================
// MAIN PDF GENERATION SERVICE
// ============================================

export class PDFGenerationService {
  
  /**
   * 🎯 MAIN PDF GENERATION METHOD - RESILIENT VERSION
   * Generates professional, LRA-compliant warning documents
   */
  static async generateWarningPDF(data: WarningPDFData): Promise<Blob> {
    try {
      console.log('🎯 Starting resilient PDF generation for warning:', data.warningId);
      console.log('📊 Input data validation:', {
        hasEmployee: !!data.employee,
        hasOrganization: !!data.organization,
        hasIncidentData: !!(data.description || data.incidentLocation),
        employeeName: data.employee ? `${data.employee.firstName} ${data.employee.lastName}` : 'Missing',
        organizationName: data.organization?.name || 'Missing',
        warningLevel: data.warningLevel,
        category: data.category
      });
      
      const startTime = Date.now();
      
      // Create PDF with professional settings
      console.log('📄 Creating PDF document with settings...');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      console.log('✅ PDF document created, setting default font...');
      // Set default font
      doc.setFont('helvetica', 'normal');
      
      let currentY = 15;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const bottomMargin = 40; // Space for footer
      
      console.log('📐 PDF layout configuration:', { pageWidth, margin, startY: currentY });
      
      // 1. Organization Header
      console.log('🏢 Adding organization header...');
      currentY = this.addOrganizationHeader(doc, data.organization, currentY, pageWidth, margin);
      console.log('✅ Organization header added, currentY:', currentY);
      
      // 2. Document Title with Draft Indicator
      console.log('📝 Adding document title...');
      currentY = this.addDocumentTitle(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      console.log('✅ Document title added, currentY:', currentY);
      
      // 3. Employee Information Section (Resilient)
      console.log('👤 Adding employee section...');
      currentY = this.addEmployeeSection(doc, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);
      console.log('✅ Employee section added, currentY:', currentY);
      
      // 4. Warning Details Section (Resilient)
      console.log('⚠️ Adding warning details section...');
      currentY = this.addWarningDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      console.log('✅ Warning details section added, currentY:', currentY);
      
      // 5. Incident Details Section (Resilient to Empty Fields)
      console.log('📋 Adding incident details section...');
      currentY = this.addIncidentDetailsSection(doc, data, currentY, pageWidth, margin, pageHeight, bottomMargin);
      console.log('✅ Incident details section added, currentY:', currentY);
      
      // 6. Progressive Discipline Analysis (if available)
      if (data.disciplineRecommendation) {
        console.log('📈 Adding progressive discipline section...');
        currentY = this.addProgressiveDisciplineSection(doc, data.disciplineRecommendation, currentY, pageWidth, margin, pageHeight, bottomMargin);
        console.log('✅ Progressive discipline section added, currentY:', currentY);
      } else {
        console.log('⏭️ Skipping progressive discipline section (no data)');
      }
      
      // 7. Legal Compliance Section
      if (data.legalCompliance) {
        console.log('⚖️ Adding legal compliance section...');
        currentY = this.addLegalComplianceSection(doc, data.legalCompliance, currentY, pageWidth, margin, pageHeight, bottomMargin);
        console.log('✅ Legal compliance section added, currentY:', currentY);
      } else {
        console.log('⏭️ Skipping legal compliance section (no data)');
      }
      
      // 8. Additional Notes Section
      if (data.additionalNotes) {
        console.log('📝 Adding additional notes section...');
        currentY = this.addAdditionalNotesSection(doc, data.additionalNotes, currentY, pageWidth, margin, pageHeight, bottomMargin);
        console.log('✅ Additional notes section added, currentY:', currentY);
      } else {
        console.log('⏭️ Skipping additional notes section (no data)');
      }
      
      // 9. Signatures Section - Always add, even if no digital signatures
      console.log('✍️ Adding signatures section...');
      currentY = this.addSignaturesSection(doc, data.signatures, data.employee, currentY, pageWidth, margin, pageHeight, bottomMargin);
      console.log('✅ Signatures section added, currentY:', currentY);
      
      // 10. Delivery Information (if available)
      if (data.deliveryChoice) {
        console.log('📮 Adding delivery section...');
        currentY = this.addDeliverySection(doc, data.deliveryChoice, currentY, pageWidth, margin, pageHeight, bottomMargin);
        console.log('✅ Delivery section added, currentY:', currentY);
      } else {
        console.log('⏭️ Skipping delivery section (no data)');
      }
      
      // 11. Footer
      console.log('🦶 Adding document footer...');
      this.addDocumentFooter(doc, data, pageWidth);
      console.log('✅ Document footer added');
      
      // 12. Security features
      console.log('🛡️ Adding security watermark...');
      this.addSecurityWatermark(doc, pageWidth);
      console.log('✅ Security watermark added');
      
      // Generate and return blob
      console.log('🔄 Generating PDF blob...');
      const pdfBlob = doc.output('blob');
      const endTime = Date.now();
      
      console.log('✅ Resilient PDF generated successfully:', {
        warningId: data.warningId,
        employee: `${data.employee.firstName} ${data.employee.lastName}`,
        size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
        time: `${endTime - startTime}ms`
      });
      
      return pdfBlob;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // ============================================
  // SECTION BUILDERS - RESILIENT VERSIONS
  // ============================================
  
  /**
   * Organization Header with Branding
   */
  private static addOrganizationHeader(
    doc: jsPDF, 
    organization: WarningPDFData['organization'], 
    startY: number, 
    pageWidth: number, 
    margin: number
  ): number {
    const headerColor = this.parseColor(organization.branding?.colors?.primary) || { r: 59, g: 130, b: 246 };
    
    // Header background
    doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(organization.name || 'Organization Name', margin, 15);
    
    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const details = [];
    if (organization.address) details.push(organization.address);
    if (organization.phone) details.push(`Tel: ${organization.phone}`);
    if (organization.email) details.push(`Email: ${organization.email}`);
    
    if (details.length > 0) {
      doc.text(details.join(' | '), margin, 25);
    }
    
    if (organization.registrationNumber) {
      doc.text(`Registration: ${organization.registrationNumber}`, margin, 30);
    }
    
    return 45;
  }
  
  /**
   * Document Title Section - WITH DRAFT INDICATOR
   */
  private static addDocumentTitle(
    doc: jsPDF, 
    data: WarningPDFData, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 30mm)
    startY = this.checkPageOverflow(doc, startY, 30, pageHeight, bottomMargin);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    
    const title = this.getWarningLevelTitle(data.warningLevel);
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    
    doc.text(title, titleX, startY);
    
    // Check if this is a draft (missing employee or category)
    const isDraft = data.employee?.firstName === 'Employee' || 
                   data.category === 'Category Not Selected' ||
                   !data.description?.trim();
    
    if (isDraft) {
      doc.setFontSize(12);
      doc.setTextColor(200, 50, 50);
      const draftText = '[DRAFT - INCOMPLETE DATA]';
      const draftWidth = doc.getTextWidth(draftText);
      const draftX = (pageWidth - draftWidth) / 2;
      doc.text(draftText, draftX, startY + 6);
      startY += 6; // Extra space for draft indicator
    }
    
    // Underline
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(titleX, startY + 2, titleX + titleWidth, startY + 2);
    
    // Document ID and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const docInfo = `Document ID: ${data.warningId} | Issue Date: ${this.formatDate(data.issuedDate)}`;
    const infoWidth = doc.getTextWidth(docInfo);
    const infoX = (pageWidth - infoWidth) / 2;
    doc.text(docInfo, infoX, startY + 8);
    
    return startY + 20;
  }
  
  /**
   * Employee Information Section - RESILIENT TO MISSING DATA
   */
  private static addEmployeeSection(
    doc: jsPDF, 
    employee: WarningPDFData['employee'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 40mm)
    startY = this.checkPageOverflow(doc, startY, 40, pageHeight, bottomMargin);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('EMPLOYEE INFORMATION', margin, startY);
    
    // Section box with conditional styling
    const isIncomplete = employee.firstName === 'Employee' || employee.lastName === 'Not Selected';
    if (isIncomplete) {
      doc.setDrawColor(255, 200, 200);
    } else {
      doc.setDrawColor(200, 200, 200);
    }
    doc.setLineWidth(0.3);
    doc.rect(margin, startY + 2, pageWidth - (margin * 2), 25);
    
    // Add warning if data is incomplete
    if (isIncomplete) {
      doc.setFillColor(255, 245, 245);
      doc.rect(margin + 1, startY + 3, pageWidth - (margin * 2) - 2, 23, 'F');
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (isIncomplete) {
      doc.setTextColor(150, 0, 0);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    
    const info = [
      `Name: ${employee.firstName} ${employee.lastName}`,
      `Employee ID: ${employee.employeeNumber}`,
      `Position: ${employee.position}`,
      `Department: ${employee.department}`
    ];
    
    if (employee.email && employee.email !== '') {
      info.push(`Email: ${employee.email}`);
    }
    
    if (isIncomplete) {
      info.push('⚠️ Complete employee selection in wizard for full details');
    }
    
    let infoY = startY + 8;
    info.forEach(line => {
      doc.text(line, margin + 3, infoY);
      infoY += 4;
    });
    
    return startY + 35;
  }
  
  /**
   * Warning Details Section - RESILIENT TO MISSING CATEGORY
   */
  private static addWarningDetailsSection(
    doc: jsPDF, 
    data: WarningPDFData, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Check if we have enough space (need about 25mm)
    startY = this.checkPageOverflow(doc, startY, 25, pageHeight, bottomMargin);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('WARNING DETAILS', margin, startY);
    
    const isCategoryMissing = data.category === 'Category Not Selected';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (isCategoryMissing) {
      doc.setTextColor(150, 0, 0);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    
    let detailY = startY + 8;
    
    doc.text(`Warning Level: ${this.getWarningLevelDisplay(data.warningLevel)}`, margin, detailY);
    detailY += 5;
    
    // Use the more reliable category field if available
    const categoryDisplay = data.category && data.category !== 'Unknown' && data.category !== 'Category Not Selected' 
      ? data.category 
      : 'General Misconduct';
    
    doc.text(`Category: ${categoryDisplay}`, margin, detailY);
    detailY += 5;
    
    if (data.validityPeriod) {
      doc.text(`Validity Period: ${data.validityPeriod} months`, margin, detailY);
      detailY += 5;
    }
    
    return detailY + 5;
  }
  
  /**
   * Incident Details Section - RESILIENT TO EMPTY FIELDS
   */
  private static addIncidentDetailsSection(
    doc: jsPDF, 
    data: WarningPDFData, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Calculate required height dynamically
    const requiredHeight = this.calculateIncidentSectionHeight(doc, data, pageWidth, margin);
    startY = this.checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('INCIDENT DETAILS', margin, startY);
    
    // Check for missing incident data
    const hasDescription = data.description && data.description.trim() !== '';
    const hasLocation = data.incidentLocation && data.incidentLocation.trim() !== '';
    const isIncomplete = !hasDescription && !hasLocation;
    
    // Section box with conditional styling for incomplete data
    const sectionHeight = this.calculateIncidentSectionHeight(doc, data, pageWidth, margin);
    if (isIncomplete) {
      doc.setDrawColor(255, 200, 200);
    } else {
      doc.setDrawColor(200, 200, 200);
    }
    doc.setLineWidth(0.3);
    doc.rect(margin, startY + 2, pageWidth - (margin * 2), sectionHeight);
    
    // Add warning background if data is incomplete
    if (isIncomplete) {
      doc.setFillColor(255, 245, 245);
      doc.rect(margin + 1, startY + 3, pageWidth - (margin * 2) - 2, sectionHeight - 2, 'F');
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let incidentY = startY + 10;
    
    // Date and Time
    doc.setFont('helvetica', 'bold');
    doc.text('Date & Time:', margin + 3, incidentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.formatDate(data.incidentDate)} at ${data.incidentTime}`, margin + 30, incidentY);
    incidentY += 6;
    
    // Location
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Location:', margin + 3, incidentY);
    doc.setFont('helvetica', 'normal');
    const locationText = hasLocation ? data.incidentLocation : 'Not specified';
    doc.text(locationText, margin + 25, incidentY);
    incidentY += 6;
    
    // Description
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', margin + 3, incidentY);
    incidentY += 5;
    
    doc.setFont('helvetica', 'normal');
    const descriptionText = hasDescription ? data.description : 'Details to be completed';
    const descriptionLines = this.wrapText(doc, descriptionText, pageWidth - margin * 2 - 6);
    descriptionLines.forEach(line => {
      doc.text(line, margin + 3, incidentY);
      incidentY += 4;
    });
    
    return startY + sectionHeight + 10;
  }
  
  /**
   * Progressive Discipline Analysis Section
   */
  private static addProgressiveDisciplineSection(
    doc: jsPDF, 
    recommendation: WarningPDFData['disciplineRecommendation'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    if (!recommendation) return startY;
    
    // Check if we have enough space (need about 35mm)
    startY = this.checkPageOverflow(doc, startY, 35, pageHeight, bottomMargin);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('PROGRESSIVE DISCIPLINE ANALYSIS', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let analysisY = startY + 8;
    
    doc.text(`Recommended Level: ${this.getWarningLevelDisplay(recommendation.suggestedLevel)}`, margin, analysisY);
    analysisY += 5;
    
    doc.text(`Previous Warnings: ${recommendation.warningCount}`, margin, analysisY);
    analysisY += 5;
    
    if (recommendation.reason) {
      doc.text('Escalation Reason:', margin, analysisY);
      analysisY += 4;
      const reasonLines = this.wrapText(doc, recommendation.reason, pageWidth - margin * 2);
      reasonLines.forEach(line => {
        doc.text(line, margin + 3, analysisY);
        analysisY += 4;
      });
    }
    
    return analysisY + 5;
  }
  
  /**
   * Legal Compliance Section
   */
  private static addLegalComplianceSection(
    doc: jsPDF, 
    legalCompliance: WarningPDFData['legalCompliance'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    if (!legalCompliance) return startY;
    
    // Check if we have enough space (need about 30mm)
    startY = this.checkPageOverflow(doc, startY, 30, pageHeight, bottomMargin);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('LEGAL COMPLIANCE', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let legalY = startY + 8;
    
    doc.text(`Framework: ${legalCompliance.framework}`, margin, legalY);
    legalY += 5;
    
    doc.text(`Compliance Status: ${legalCompliance.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`, margin, legalY);
    legalY += 5;
    
    if (legalCompliance.requirements.length > 0) {
      doc.text('Legal Requirements:', margin, legalY);
      legalY += 4;
      
      legalCompliance.requirements.forEach(req => {
        doc.text(`• ${req}`, margin + 3, legalY);
        legalY += 4;
      });
    }
    
    return legalY + 5;
  }
  
  /**
   * Additional Notes Section
   */
  private static addAdditionalNotesSection(
    doc: jsPDF, 
    notes: string, 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Calculate height based on text length
    const notesLines = this.wrapText(doc, notes, pageWidth - margin * 2);
    const requiredHeight = 15 + (notesLines.length * 4);
    startY = this.checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('ADDITIONAL NOTES', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let notesY = startY + 8;
    notesLines.forEach(line => {
      doc.text(line, margin, notesY);
      notesY += 4;
    });
    
    return notesY + 5;
  }
  
  /**
   * Signatures Section
   */
  private static addSignaturesSection(
    doc: jsPDF, 
    signatures: WarningPDFData['signatures'], 
    employee: WarningPDFData['employee'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    // Always ensure signatures section fits (need about 50mm)
    startY = this.checkPageOverflow(doc, startY, 50, pageHeight, bottomMargin);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('SIGNATURES', margin, startY);
    
    const signatureBoxWidth = (pageWidth - margin * 3) / 2;
    const signatureBoxHeight = 30;
    
    // Manager signature box
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.rect(margin, startY + 5, signatureBoxWidth, signatureBoxHeight);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Manager Signature:', margin + 2, startY + 12);
    
    if (signatures?.manager) {
      try {
        // Add the signature image
        const imgWidth = signatureBoxWidth - 4;
        const imgHeight = 15;
        doc.addImage(signatures.manager, 'PNG', margin + 2, startY + 15, imgWidth, imgHeight);
        doc.setFontSize(8);
        doc.text(`Date: ${this.formatDate(new Date())}`, margin + 2, startY + 32);
      } catch (error) {
        console.warn('Failed to embed manager signature image:', error);
        // Fallback to text
        doc.setFontSize(8);
        doc.text('✓ Digitally Signed', margin + 2, startY + 20);
        doc.text(`Date: ${this.formatDate(new Date())}`, margin + 2, startY + 25);
      }
    } else {
      doc.text('_________________________', margin + 2, startY + 25);
      doc.text('Date: ___________', margin + 2, startY + 30);
    }
    
    // Employee signature box
    doc.rect(margin + signatureBoxWidth + 10, startY + 5, signatureBoxWidth, signatureBoxHeight);
    
    doc.text('Employee Signature:', margin + signatureBoxWidth + 12, startY + 12);
    doc.text(`${employee.firstName} ${employee.lastName}`, margin + signatureBoxWidth + 12, startY + 16);
    
    if (signatures?.employee) {
      try {
        // Add the signature image
        const imgWidth = signatureBoxWidth - 4;
        const imgHeight = 15;
        doc.addImage(signatures.employee, 'PNG', margin + signatureBoxWidth + 12, startY + 15, imgWidth, imgHeight);
        doc.setFontSize(8);
        doc.text(`Date: ${this.formatDate(new Date())}`, margin + signatureBoxWidth + 12, startY + 32);
      } catch (error) {
        console.warn('Failed to embed employee signature image:', error);
        // Fallback to text
        doc.setFontSize(8);
        doc.text('✓ Digitally Signed', margin + signatureBoxWidth + 12, startY + 20);
        doc.text(`Date: ${this.formatDate(new Date())}`, margin + signatureBoxWidth + 12, startY + 25);
      }
    } else {
      doc.text('_________________________', margin + signatureBoxWidth + 12, startY + 25);
      doc.text('Date: ___________', margin + signatureBoxWidth + 12, startY + 30);
    }
    
    return startY + signatureBoxHeight + 15;
  }
  
  /**
   * Delivery Information Section
   */
  private static addDeliverySection(
    doc: jsPDF, 
    delivery: WarningPDFData['deliveryChoice'], 
    startY: number, 
    pageWidth: number, 
    margin: number,
    pageHeight: number,
    bottomMargin: number
  ): number {
    if (!delivery) return startY;
    
    // Check if we have enough space (need about 20mm)
    startY = this.checkPageOverflow(doc, startY, 20, pageHeight, bottomMargin);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('DELIVERY INFORMATION', margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let deliveryY = startY + 6;
    
    doc.text(`Delivery Method: ${delivery.method.toUpperCase()}`, margin, deliveryY);
    deliveryY += 4;
    
    doc.text(`Delivery Date: ${this.formatDate(delivery.timestamp)}`, margin, deliveryY);
    deliveryY += 4;
    
    doc.text(`Authorized by: ${delivery.chosenBy}`, margin, deliveryY);
    
    return deliveryY + 8;
  }
  
  /**
   * Document Footer - Multi-page aware
   */
  private static addDocumentFooter(doc: jsPDF, data: WarningPDFData, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const totalPages = doc.getNumberOfPages();
    
    // Add footer to each page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      
      const footerText = 'This document has been generated electronically and constitutes an official warning as per LRA Section 188.';
      const footerWidth = doc.getTextWidth(footerText);
      const footerX = (pageWidth - footerWidth) / 2;
      doc.text(footerText, footerX, pageHeight - 20);
      
      // Confidentiality notice
      const confText = 'CONFIDENTIAL DOCUMENT - For authorized personnel only';
      const confWidth = doc.getTextWidth(confText);
      const confX = (pageWidth - confWidth) / 2;
      doc.text(confText, confX, pageHeight - 15);
      
      // Page number and timestamp
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 50, pageHeight - 10);
    }
  }
  
  /**
   * Security Watermark - Multi-page aware
   */
  private static addSecurityWatermark(doc: jsPDF, pageWidth: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const totalPages = doc.getNumberOfPages();
    
    // Add watermark to each page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Save graphics state
      doc.saveGraphicsState();
      
      // Set transparency
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      
      // Watermark text
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      
      doc.text('OFFICIAL WARNING', centerX, centerY, {
        angle: 45,
        align: 'center'
      });
      
      // Restore graphics state
      doc.restoreGraphicsState();
    }
  }
  
  // ============================================
  // PAGE MANAGEMENT UTILITIES
  // ============================================
  
  /**
   * Check if content will fit on current page, add new page if needed
   */
  private static checkPageOverflow(
    doc: jsPDF, 
    currentY: number, 
    requiredHeight: number, 
    pageHeight: number, 
    bottomMargin: number
  ): number {
    const maxY = pageHeight - bottomMargin;
    
    if (currentY + requiredHeight > maxY) {
      console.log(`📄 Adding new page - current Y: ${currentY}, required: ${requiredHeight}, max: ${maxY}`);
      doc.addPage();
      return 20; // Start new page with top margin
    }
    
    return currentY;
  }
  
  /**
   * Add page header for continuation pages
   */
  private static addPageHeader(doc: jsPDF, data: WarningPDFData, pageNumber: number): void {
    const pageWidth = doc.internal.pageSize.width;
    
    // Simple header for continuation pages
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    const headerText = `${data.organization.name} - Warning Document (Continued)`;
    doc.text(headerText, 20, 10);
    
    const pageText = `Page ${pageNumber}`;
    doc.text(pageText, pageWidth - 40, 10);
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 12, pageWidth - 20, 12);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  /**
   * Get warning level display name
   */
  private static getWarningLevelDisplay(level: string): string {
    const levelMap: Record<string, string> = {
      'counselling': 'Counselling Session',
      'verbal': 'Verbal Warning',
      'first_written': 'First Written Warning',
      'second_written': 'Second Written Warning',
      'final_written': 'Final Written Warning',
      'suspension': 'Suspension',
      'dismissal': 'Dismissal'
    };
    
    return levelMap[level] || level.replace('_', ' ').toUpperCase();
  }
  
  /**
   * Get warning level document title
   */
  private static getWarningLevelTitle(level: string): string {
    const titleMap: Record<string, string> = {
      'counselling': 'COUNSELLING SESSION RECORD',
      'verbal': 'VERBAL WARNING NOTICE',
      'first_written': 'FIRST WRITTEN WARNING',
      'second_written': 'SECOND WRITTEN WARNING',
      'final_written': 'FINAL WRITTEN WARNING',
      'suspension': 'SUSPENSION NOTICE',
      'dismissal': 'DISMISSAL NOTICE'
    };
    
    return titleMap[level] || 'WARNING NOTICE';
  }
  
  /**
   * Format date consistently
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Wrap text to fit within specified width
   */
  private static wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  /**
   * Calculate incident section height - RESILIENT VERSION
   */
  private static calculateIncidentSectionHeight(
    doc: jsPDF, 
    data: WarningPDFData, 
    pageWidth: number, 
    margin: number
  ): number {
    let height = 25; // Base height for date/time and location
    
    // Add height for description (or placeholder text)
    const descriptionText = data.description && data.description.trim() !== '' 
      ? data.description 
      : '[Incident description not provided - complete in wizard]';
    
    const descriptionLines = this.wrapText(doc, descriptionText, pageWidth - margin * 2 - 6);
    height += descriptionLines.length * 4;
    
    // Add extra height for warning message if incomplete
    const hasDescription = data.description && data.description.trim() !== '';
    const hasLocation = data.incidentLocation && data.incidentLocation.trim() !== '';
    const isIncomplete = !hasDescription && !hasLocation;
    
    if (isIncomplete) {
      height += 10; // Space for warning message
    }
    
    return Math.max(height, 45); // Minimum height
  }
  
  /**
   * Parse color string to RGB
   */
  private static parseColor(colorString?: string): { r: number; g: number; b: number } | null {
    if (!colorString) return null;
    
    // Handle hex colors
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
}