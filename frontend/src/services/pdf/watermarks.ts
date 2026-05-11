// frontend/src/services/pdf/watermarks.ts
//
// Watermark renderers for the PDF generator family. Extracted in Phase 2
// Tier 3B step 3. Both functions operate on every page of the jsPDF doc and
// preserve byte-identical output for the frozen v1.0.0/v1.1.0 paths —
// PDFGenerationService.ts keeps private delegates so existing call sites
// don't need to change.

/**
 * Multi-page security watermark — diagonal grey "OFFICIAL WARNING" (or custom
 * text) across the centre of every page. Text and opacity are configurable
 * via the optional `watermarkSettings` (used by v1.2.0 template path).
 */
export function addSecurityWatermark(
  doc: any,
  pageWidth: number,
  watermarkSettings?: { watermarkText?: string; watermarkOpacity?: number }
): void {
  const pageHeight = doc.internal.pageSize.height;
  const totalPages = doc.getNumberOfPages();

  const wmText = watermarkSettings?.watermarkText || 'OFFICIAL WARNING';
  const wmOpacity = watermarkSettings?.watermarkOpacity || 0.1;

  // Add watermark to each page
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Save graphics state
    doc.saveGraphicsState();

    // Set transparency
    doc.setGState(new doc.GState({ opacity: wmOpacity }));

    // Watermark text
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');

    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    doc.text(wmText, centerX, centerY, {
      angle: 45,
      align: 'center',
    });

    // Restore graphics state
    doc.restoreGraphicsState();
  }
}

/**
 * OVERTURNED watermark — applied when an appeal has overturned a warning.
 * Prominent diagonal red text across every page (35% opacity, 60pt). Called
 * AFTER {@link addSecurityWatermark} so it visually overlays the standard mark.
 */
export function addOverturnedWatermark(doc: any, pageWidth: number): void {
  const pageHeight = doc.internal.pageSize.height;
  const totalPages = doc.getNumberOfPages();

  // Add OVERTURNED watermark to each page
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Save graphics state
    doc.saveGraphicsState();

    // Set transparency - higher opacity so it's clearly visible
    doc.setGState(new doc.GState({ opacity: 0.35 }));

    // Watermark text - RED color for OVERTURNED status
    doc.setTextColor(255, 0, 0); // Bright red
    doc.setFontSize(60); // Large and prominent
    doc.setFont('helvetica', 'bold');

    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    doc.text('OVERTURNED', centerX, centerY, {
      angle: 45,
      align: 'center',
    });

    // Restore graphics state
    doc.restoreGraphicsState();
  }
}
