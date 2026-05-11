// frontend/src/services/pdf/signatureConverter.ts
//
// SVG → PNG signature converter. jsPDF doesn't support SVG natively, so we
// convert on-the-fly before embedding. Extracted from PDFGenerationService
// (instance method `convertSignatureToPNG`) in Phase 2 Tier 3B step 7.
// Pure function — no instance state was used by the original method.

import Logger from '../../utils/logger';
import { convertSVGToPNG, isSignatureSVG } from '../../utils/signatureSVG';

/**
 * Convert an SVG signature to a PNG data URL suitable for jsPDF embedding.
 * Falls back to returning the input unchanged if it's not SVG, or to the
 * original on conversion error (jsPDF will then likely fail, but better
 * than crashing the whole PDF generation).
 *
 * Default render dimensions: 600×300 (matches the original v1.0.0 behavior).
 */
export async function convertSignatureToPNG(signature: string): Promise<string> {
  if (!signature) return signature;

  // If already PNG or other format, return as-is
  if (!isSignatureSVG(signature)) {
    return signature;
  }

  try {
    // Convert SVG to PNG using canvas rendering
    const pngSignature = await convertSVGToPNG(signature, 600, 300);
    return pngSignature;
  } catch (error) {
    Logger.error('Failed to convert SVG signature to PNG for PDF:', error);
    // Return original signature (will likely fail in PDF, but better than nothing)
    return signature;
  }
}
