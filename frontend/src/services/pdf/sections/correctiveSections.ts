// frontend/src/services/pdf/sections/correctiveSections.ts
//
// Corrective discussion section renderers (B, C, E, F + Review Date +
// Intervention Details). Extracted from PDFGenerationService in Phase 2
// Tier 3B step 5. Per CLAUDE.md these sections are hardcoded (not routed
// through the dynamic template renderer) — every warning includes them
// when the corresponding data fields are populated.
//
// All bodies are byte-identical to the originals; internal `this.X`
// helper references are replaced with direct imports from `../utils`.

import { wrapText, checkPageOverflow, formatDate } from '../utils';

/**
 * Section B: Employee's Statement
 * Employee's version of events regarding the incident
 */
export function addEmployeeStatementSection(
  doc: any,
  statement: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate height based on text length (increased line spacing from 4 to 5)
  const statementLines = wrapText(doc, statement, pageWidth - margin * 2 - 6);
  const requiredHeight = 20 + (statementLines.length * 5);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text("(B) EMPLOYEE'S VERSION OF EVENTS", margin, startY);

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let contentY = startY + 8;
  statementLines.forEach(line => {
    // Skip empty lines but preserve spacing
    if (line.trim() === '') {
      contentY += 3; // Half spacing for empty lines
    } else {
      doc.text(line, margin, contentY);
      contentY += 5; // Increased from 4 to 5 for better readability
    }
  });

  return contentY + 8;
}

/**
 * Section C: Expected Behavior & Standards
 * Required/expected behavior, performance, conduct, and standards
 */
export function addExpectedBehaviorSection(
  doc: any,
  standards: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate height based on text length (increased line spacing from 4 to 5)
  const standardsLines = wrapText(doc, standards, pageWidth - margin * 2 - 6);
  const requiredHeight = 20 + (standardsLines.length * 5);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('(C) REQUIRED/EXPECTED BEHAVIOR & STANDARDS', margin, startY);

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let contentY = startY + 8;
  standardsLines.forEach(line => {
    // Skip empty lines but preserve spacing
    if (line.trim() === '') {
      contentY += 3; // Half spacing for empty lines
    } else {
      doc.text(line, margin, contentY);
      contentY += 5; // Increased from 4 to 5 for better readability
    }
  });

  return contentY + 8;
}

/**
 * Section E: Facts Leading to Decision
 * Facts and reasoning for the disciplinary action taken
 */
export function addFactsLeadingToDecisionSection(
  doc: any,
  facts: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate height based on text length (increased line spacing from 4 to 5)
  const factsLines = wrapText(doc, facts, pageWidth - margin * 2 - 6);
  const requiredHeight = 20 + (factsLines.length * 5);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('(E) FACTS & REASONING FOR DISCIPLINARY ACTION', margin, startY);

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let contentY = startY + 8;
  factsLines.forEach(line => {
    // Skip empty lines but preserve spacing
    if (line.trim() === '') {
      contentY += 3; // Half spacing for empty lines
    } else {
      doc.text(line, margin, contentY);
      contentY += 5; // Increased from 4 to 5 for better readability
    }
  });

  return contentY + 8;
}

/**
 * Section F: Improvement Commitments
 * Action steps and improvement commitments with timelines
 */
export function addImprovementCommitmentsSection(
  doc: any,
  commitments: Array<{ commitment: string; timeline: string }>,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate height based on number of commitments
  let totalLines = 0;
  commitments.forEach(item => {
    const commitmentLines = wrapText(doc, item.commitment, pageWidth - margin * 2 - 12);
    totalLines += commitmentLines.length + 1; // +1 for timeline
  });
  const requiredHeight = 20 + (totalLines * 4);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('(F) ACTION STEPS & IMPROVEMENT COMMITMENTS', margin, startY);

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let contentY = startY + 8;
  commitments.forEach((item, index) => {
    // Commitment number
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}.`, margin, contentY);

    // Commitment text
    doc.setFont('helvetica', 'normal');
    const commitmentLines = wrapText(doc, item.commitment, pageWidth - margin * 2 - 12);
    commitmentLines.forEach((line, lineIndex) => {
      doc.text(line, margin + 6, contentY + (lineIndex * 4));
    });
    contentY += commitmentLines.length * 4;

    // Timeline
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text(`Timeline: ${item.timeline || 'Immediately'}`, margin + 6, contentY);
    doc.setTextColor(0, 0, 0);
    contentY += 6;
  });

  return contentY + 8;
}

/**
 * Review Date and Auto-Satisfaction Clause Section
 * Explains review date and automatic satisfaction if no follow-up action taken
 */
export function addReviewDateSection(
  doc: any,
  reviewDate: Date,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number,
  warningLevel?: string
): number {
  const requiredHeight = 60; // Increased for auto-satisfaction clause
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('REVIEW DATE AND AUTO-SATISFACTION CLAUSE', margin, startY);

  // Review date with green highlight background
  const formattedDate = formatDate(reviewDate);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  // Measure text width for highlight background
  const dateTextWidth = doc.getTextWidth(formattedDate);

  // Add green highlight background
  doc.setFillColor(220, 252, 231); // Light green background (#dcfce7)
  doc.rect(margin, startY + 3, dateTextWidth + 4, 6, 'F');

  // Draw review date text on top of highlight
  doc.text(formattedDate, margin + 2, startY + 8);

  // Auto-satisfaction clause heading
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Automatic Satisfaction Clause:', margin, startY + 18);

  // Auto-satisfaction clause text - varies by warning level
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  let clauseText: string;

  // Determine clause wording based on warning level
  // Dismissal is a terminal action - no auto-satisfaction
  if (warningLevel === 'dismissal') {
    // No clause for terminal actions
    return startY + 18;
  } else if (warningLevel === 'final_written') {
    clauseText =
      'If the required improvements are not demonstrated by the review date and no follow-up ' +
      'disciplinary action is taken within 7 days thereafter, this matter will be considered ' +
      'resolved. However, if performance or conduct issues persist, additional corrective ' +
      'action or further disciplinary measures may be initiated.';
  } else {
    // Default for counselling, verbal, first_written, second_written
    clauseText =
      'If no follow-up action is required by management within 7 days of this review date, ' +
      'the employee\'s performance and conduct will be deemed satisfactory, and this matter ' +
      'will be considered resolved. If performance or conduct issues persist, additional ' +
      'corrective action or disciplinary measures may be initiated at that time.';
  }

  // Wrap and render clause text
  const maxWidth = pageWidth - margin * 2;
  const clauseLines = wrapText(doc, clauseText, maxWidth);

  let clauseY = startY + 24;
  clauseLines.forEach(line => {
    doc.text(line, margin, clauseY);
    clauseY += 4;
  });

  return clauseY + 8;
}

/**
 * Intervention Details Section
 * Training/coaching provided to support improvement
 */
export function addInterventionDetailsSection(
  doc: any,
  interventionDetails: string,
  startY: number,
  pageWidth: number,
  margin: number,
  pageHeight: number,
  bottomMargin: number
): number {
  // Calculate height based on text length
  const interventionLines = wrapText(doc, interventionDetails, pageWidth - margin * 2 - 6);
  const requiredHeight = 20 + (interventionLines.length * 4);
  startY = checkPageOverflow(doc, startY, requiredHeight, pageHeight, bottomMargin);

  // Section header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('TRAINING/COACHING PROVIDED', margin, startY);

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  let contentY = startY + 8;
  interventionLines.forEach(line => {
    doc.text(line, margin, contentY);
    contentY += 4;
  });

  return contentY + 8;
}
