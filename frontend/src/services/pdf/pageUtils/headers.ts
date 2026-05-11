// frontend/src/services/pdf/pageUtils/headers.ts
//
// Organization header layouts + logo helpers. Extracted from
// PDFGenerationService in Phase 2 Tier 3B step 6.
//
// `addOrganizationHeader` is the public entry point — it picks one of
// three layouts based on `headerSettings.headerLayout`:
//   - 'stacked'  → addStackedHeader  (logo centered above name)
//   - 'classic'  → addClassicHeader  (logo left, text right)
//   - 'banner'   → addBannerHeader   (DEFAULT — colored band, used by all
//                                     frozen v1.0.0 / v1.1.0 PDFs)
//
// Bodies are byte-identical to the originals; internal `this.X` helper
// references are replaced with direct imports.

import type { WarningPDFData } from '../../PDFGenerationService';
import Logger from '../../../utils/logger';
import { parseColor } from '../utils';

/**
 * Prepare a logo for jsPDF rendering. Handles remote URLs, data URLs, and
 * any image format the browser supports; downsizes to fit the max bounds;
 * returns a PNG data URL that jsPDF can reliably render.
 */
export async function prepareLogoForPDF(
  logoSrc: string,
  maxWidth = 800,
  maxHeight = 400
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = logoSrc;
  });
}

/**
 * Add a logo image to the PDF preserving aspect ratio within `maxWidth` and
 * `maxHeight` bounds. Returns the actual rendered `{ width, height }` in mm
 * so callers can compute the layout flow.
 */
export function addLogoWithAspectRatio(
  doc: any,
  logo: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const imgProps = doc.getImageProperties(logo);
  const imgWidth = imgProps.width;
  const imgHeight = imgProps.height;
  const aspectRatio = imgWidth / imgHeight;

  let finalWidth = maxWidth;
  let finalHeight = maxWidth / aspectRatio;

  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = maxHeight * aspectRatio;
  }

  doc.addImage(logo, 'PNG', x, y, finalWidth, finalHeight);
  return { width: finalWidth, height: finalHeight };
}

/**
 * Organization Header with Branding — supports 3 configurable layouts.
 *
 * When called without headerSettings (v1.0.0 / v1.1.0 frozen callers),
 * defaults to 'banner' layout to preserve byte-identical output.
 */
export function addOrganizationHeader(
  doc: any,
  organization: WarningPDFData['organization'],
  startY: number,
  pageWidth: number,
  margin: number,
  headerSettings?: {
    headerLayout?: 'stacked' | 'classic' | 'banner';
    logoMaxHeight?: number;
    processedLogo?: string; // Pre-processed PNG data URL ready for jsPDF
  }
): number {
  const layout = headerSettings?.headerLayout || 'banner';
  const logoMaxHeight = headerSettings?.logoMaxHeight || 20;
  const headerColor = parseColor(organization.branding?.colors?.primary) || { r: 59, g: 130, b: 246 };
  const companyName = organization.branding?.companyName || organization.name || 'Organization Name';
  const contentWidth = pageWidth - margin * 2;

  // Use pre-processed logo (PNG data URL) if available
  if (headerSettings?.processedLogo) {
    organization = {
      ...organization,
      branding: { ...organization.branding, logo: headerSettings.processedLogo }
    };
  }

  // Build contact details — collapse multi-line addresses into single line
  const details: string[] = [];
  if (organization.address) {
    // Replace newlines/carriage returns with ", " for compact single-line display
    const flatAddress = organization.address.replace(/[\r\n]+/g, ', ').replace(/,\s*,/g, ',').trim();
    if (flatAddress) details.push(flatAddress);
  }
  if (organization.phone) details.push(`Tel: ${organization.phone}`);
  if (organization.email) details.push(`Email: ${organization.email}`);
  // Note: `branding.website` is runtime-added on some orgs; cast preserves the original behavior.
  const brandingAny = organization.branding as any;
  if (brandingAny?.website) details.push(brandingAny.website);
  const detailsLine = details.join(' | ');
  const regLine = organization.registrationNumber ? `Registration: ${organization.registrationNumber}` : '';

  if (layout === 'stacked') {
    return addStackedHeader(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
  } else if (layout === 'classic') {
    return addClassicHeader(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
  } else {
    return addBannerHeader(doc, organization, companyName, detailsLine, regLine, headerColor, startY, pageWidth, margin, contentWidth, logoMaxHeight);
  }
}

/**
 * Layout A: "Stacked" — logo centered above name, white background, colored divider.
 */
export function addStackedHeader(
  doc: any,
  organization: WarningPDFData['organization'],
  companyName: string,
  detailsLine: string,
  regLine: string,
  headerColor: { r: number; g: number; b: number },
  startY: number,
  pageWidth: number,
  margin: number,
  contentWidth: number,
  logoMaxHeight: number
): number {
  let currentY = startY;
  const centerX = pageWidth / 2;

  // Logo: centered, aspect-ratio aware
  if (organization.branding?.logo) {
    try {
      const maxLogoWidth = contentWidth * 0.4; // Max 40% of content width
      const imgProps = doc.getImageProperties(organization.branding.logo);
      const aspectRatio = imgProps.width / imgProps.height;

      let finalWidth = maxLogoWidth;
      let finalHeight = maxLogoWidth / aspectRatio;
      if (finalHeight > logoMaxHeight) {
        finalHeight = logoMaxHeight;
        finalWidth = logoMaxHeight * aspectRatio;
      }

      const logoX = centerX - finalWidth / 2;
      doc.addImage(organization.branding.logo, 'PNG', logoX, currentY, finalWidth, finalHeight);
      currentY += finalHeight + 4;
    } catch (error) {
      Logger.warn('Failed to add organization logo to stacked header:', error);
    }
  }

  // Company name — centered, brand color
  doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, centerX, currentY, { align: 'center' });
  currentY += 6;

  // Contact details — centered, gray, with word-wrap for long lines
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const lineHeight = 4; // mm per line
  if (detailsLine) {
    const wrappedDetails = doc.splitTextToSize(detailsLine, contentWidth);
    doc.text(wrappedDetails, centerX, currentY, { align: 'center' });
    currentY += wrappedDetails.length * lineHeight;
  }
  if (regLine) {
    doc.text(regLine, centerX, currentY, { align: 'center' });
    currentY += lineHeight;
  }

  // Colored divider line (1mm)
  currentY += 2;
  doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b);
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  doc.setTextColor(0, 0, 0);
  return currentY;
}

/**
 * Layout B: "Classic Letterhead" — logo left, text right, colored divider.
 */
export function addClassicHeader(
  doc: any,
  organization: WarningPDFData['organization'],
  companyName: string,
  detailsLine: string,
  regLine: string,
  headerColor: { r: number; g: number; b: number },
  startY: number,
  pageWidth: number,
  margin: number,
  contentWidth: number,
  logoMaxHeight: number
): number {
  let logoEndX = margin;
  let logoHeight = 0;

  // Logo: left-aligned, aspect-ratio aware
  if (organization.branding?.logo) {
    try {
      const maxLogoWidth = contentWidth * 0.25; // Max 25% of content width
      const dims = addLogoWithAspectRatio(
        doc, organization.branding.logo,
        margin, startY,
        maxLogoWidth, logoMaxHeight
      );
      logoEndX = margin + dims.width + 6; // 6mm gap between logo and text
      logoHeight = dims.height;
    } catch (error) {
      Logger.warn('Failed to add organization logo to classic header:', error);
    }
  }

  // Text block — right of logo
  let textY = startY + 5;

  doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, logoEndX, textY);
  textY += 6;

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const textAreaWidth = pageWidth - margin - logoEndX; // available width for text
  if (detailsLine) {
    const wrappedDetails = doc.splitTextToSize(detailsLine, textAreaWidth);
    doc.text(wrappedDetails, logoEndX, textY);
    textY += wrappedDetails.length * 4;
  }
  if (regLine) {
    doc.text(regLine, logoEndX, textY);
    textY += 4;
  }

  // Dynamic height = max(logo height, text block height) + padding
  const textBlockHeight = textY - startY;
  let currentY = startY + Math.max(logoHeight, textBlockHeight) + 3;

  // Colored divider line (1mm)
  doc.setDrawColor(headerColor.r, headerColor.g, headerColor.b);
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  doc.setTextColor(0, 0, 0);
  return currentY;
}

/**
 * Layout C: "Banner" — colored background band. This is the DEFAULT and
 * matches the byte-output of the original frozen v1.0.0 / v1.1.0 PDFs.
 */
export function addBannerHeader(
  doc: any,
  organization: WarningPDFData['organization'],
  companyName: string,
  detailsLine: string,
  regLine: string,
  headerColor: { r: number; g: number; b: number },
  startY: number,
  pageWidth: number,
  margin: number,
  _contentWidth: number,
  logoMaxHeight: number
): number {
  // Calculate band height dynamically based on content
  const bandPadding = 5; // mm padding top & bottom
  const nameY = bandPadding + 10; // company name baseline
  let detailY = nameY + 8; // details start below name
  const detailLineHeight = 4;

  // Pre-calculate detail line count for band height
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const detailMaxWidth = pageWidth - margin * 2;
  const wrappedDetails = detailsLine ? doc.splitTextToSize(detailsLine, detailMaxWidth) : [];
  const detailLines = wrappedDetails.length || 0;

  let bandHeight = detailY + (detailLines * detailLineHeight);
  if (regLine) bandHeight += detailLineHeight;
  bandHeight += bandPadding; // bottom padding

  // Colored background band
  doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
  doc.rect(0, 0, pageWidth, bandHeight, 'F');

  let logoWidth = 0;
  if (organization.branding?.logo) {
    try {
      const maxLogoWidth = 40;
      const logoY = bandPadding + 2;
      const dims = addLogoWithAspectRatio(
        doc, organization.branding.logo,
        margin, logoY,
        maxLogoWidth, Math.min(logoMaxHeight, 20)
      );
      logoWidth = dims.width;
    } catch (error) {
      Logger.warn('Failed to add organization logo to banner header:', error);
      logoWidth = 0;
    }
  }

  // Company name — white text on colored band
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin + logoWidth + (logoWidth > 0 ? 10 : 0), nameY);

  // Details — white text, word-wrapped
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (wrappedDetails.length > 0) {
    doc.text(wrappedDetails, margin, detailY);
    detailY += wrappedDetails.length * detailLineHeight;
  }
  if (regLine) {
    doc.text(regLine, margin, detailY);
  }

  doc.setTextColor(0, 0, 0);
  return bandHeight + 10; // 10mm gap below band
}
