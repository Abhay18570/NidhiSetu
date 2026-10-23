/**
 * NidhiSetu Document Intelligence — Unified Client-Side OCR & Document Processing Engine
 * Orchestrates native PDF digital text extraction and Tesseract.js optical character recognition
 * entirely within the client browser. Zero document transmission to external servers.
 */

import { extractPdfText, renderPdfPageToCanvas } from './pdfTextExtractor';
import { extractFdrFields } from './fdrFieldExtractor';

/**
 * Creates and initializes a Tesseract.js OCR worker dynamically.
 * Lazy-loads tesseract.js to avoid bloating initial application bundle.
 */
async function createTesseractWorker(options = {}) {
  const { onProgress, signal } = options;

  if (signal?.aborted) {
    throw new Error('OCR operation was cancelled before initialization.');
  }

  try {
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (signal?.aborted) {
          try {
            worker.terminate();
          } catch {
            // ignore
          }
          return;
        }

        if (onProgress && m) {
          let pct = 50;
          if (m.status === 'recognizing text') {
            pct = 50 + Math.round((m.progress || 0) * 45);
          } else if (m.status === 'loading tesseract core') {
            pct = 20;
          } else if (m.status === 'loading language traineddata') {
            pct = 35;
          }

          onProgress({
            phase: 'ocr_recognition',
            message: m.status || 'Recognizing text...',
            percent: Math.min(95, pct),
          });
        }
      },
    });

    return worker;
  } catch (err) {
    console.warn('[NidhiSetu OCR] Failed to initialize Tesseract worker:', err);
    throw new Error('OCR Engine could not be initialized in this environment: ' + err.message);
  }
}

/**
 * Recognizes text from an image source (Image Element, Canvas, Blob, or File)
 *
 * @param {Blob|File|HTMLCanvasElement|string} imageSource
 * @param {Object} options
 * @returns {Promise<string>} Recognized text string
 */
export async function recognizeImageText(imageSource, options = {}) {
  const { onProgress, signal } = options;

  if (signal?.aborted) {
    throw new Error('OCR operation cancelled by user.');
  }

  let worker = null;
  try {
    worker = await createTesseractWorker({ onProgress, signal });

    if (signal?.aborted) {
      throw new Error('OCR operation cancelled by user.');
    }

    const { data } = await worker.recognize(imageSource);
    return data?.text || '';
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // worker cleanup
      }
    }
  }
}

/**
 * High-level unified document analyzer:
 * 1. Inspects file type (PDF vs JPEG/PNG/WebP).
 * 2. If PDF, attempts native text extraction first.
 * 3. If native PDF text is insufficient (scanned PDF) or file is an image, runs browser OCR.
 * 4. Extracts structured financial fields.
 * 5. Cleans up all memory, canvas, and worker resources.
 *
 * @param {Blob|File} file
 * @param {Object} options - { onProgress, signal, maxPages, syntheticTextFixture }
 * @returns {Promise<Object>} Unified extraction result
 */
export async function processDocumentForIntelligence(file, options = {}) {
  const startTime = Date.now();
  const { onProgress, signal, maxPages = 3, syntheticTextFixture } = options;

  if (signal?.aborted) {
    throw new Error('Document processing cancelled by user.');
  }

  if (onProgress) {
    onProgress({ phase: 'init', message: 'Preparing document for intelligence scan...', percent: 5 });
  }

  // Support deterministic test or synthetic mode if explicit fixture provided
  if (syntheticTextFixture && typeof syntheticTextFixture === 'string') {
    if (onProgress) onProgress({ phase: 'parsing', message: 'Extracting financial fields...', percent: 80 });
    const extractedFields = extractFdrFields(syntheticTextFixture, 1);
    const words = syntheticTextFixture.trim().split(/\s+/).filter(Boolean);

    return {
      sourceType: 'SYNTHETIC_FIXTURE',
      fullText: syntheticTextFixture,
      pages: [{ pageNumber: 1, text: syntheticTextFixture }],
      extractedFields,
      extractionMetadata: {
        sourceType: 'SYNTHETIC_FIXTURE',
        pageCount: 1,
        wordCount: words.length,
        isUnreadable: words.length < 10,
        rawSampleSnippet: syntheticTextFixture.slice(0, 150),
        processingDurationMs: Date.now() - startTime,
      },
    };
  }

  if (!file) {
    throw new Error('No document file provided for intelligence processing.');
  }

  const fileName = file.name || 'document';
  const fileType = file.type || '';
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

  let fullText = '';
  let pages = [];
  let pageCount = 1;
  let sourceType = 'OCR_IMAGE';

  if (isPdf) {
    if (onProgress) {
      onProgress({ phase: 'reading_pdf', message: 'Checking digital PDF text layer...', percent: 15 });
    }

    try {
      const pdfResult = await extractPdfText(file, {
        maxPages,
        signal,
        onProgress: (p) => {
          if (onProgress) {
            onProgress({
              phase: 'reading_pdf',
              message: `Reading page ${p.currentPage} of ${p.totalPages}...`,
              percent: 15 + Math.round((p.percent / 100) * 25),
            });
          }
        },
      });

      pageCount = pdfResult.pageCount || 1;

      if (pdfResult.hasTextLayer) {
        // Native text layer is present and usable! No heavy OCR required
        fullText = pdfResult.fullText;
        pages = pdfResult.pages;
        sourceType = 'PDF_DIGITAL_TEXT';

        if (onProgress) {
          onProgress({ phase: 'text_extracted', message: 'Native PDF text layer parsed successfully.', percent: 75 });
        }
      } else {
        // Fallback to OCR for scanned PDF
        sourceType = 'PDF_SCANNED_OCR';
        if (onProgress) {
          onProgress({ phase: 'ocr_fallback', message: 'Scanned PDF detected. Rendering pages for OCR...', percent: 45 });
        }

        const pagesToOcr = Math.min(pageCount, maxPages);
        let worker = null;

        try {
          worker = await createTesseractWorker({ onProgress, signal });

          for (let pNum = 1; pNum <= pagesToOcr; pNum++) {
            if (signal?.aborted) throw new Error('OCR processing cancelled by user.');

            const canvas = await renderPdfPageToCanvas(pdfResult.pdfDoc, pNum);
            const { data } = await worker.recognize(canvas);
            const ocrPageText = (data?.text || '').trim();

            pages.push({ pageNumber: pNum, text: ocrPageText });
            fullText += (fullText ? '\n\n' : '') + ocrPageText;

            // Free canvas memory
            canvas.width = 0;
            canvas.height = 0;
          }
        } finally {
          if (worker) {
            try {
              await worker.terminate();
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (pdfErr) {
      if (signal?.aborted || pdfErr.message?.includes('cancelled')) {
        throw pdfErr;
      }
      console.warn('[NidhiSetu Intelligence] PDF parsing error:', pdfErr);
      throw new Error(`Failed to parse PDF document: ${pdfErr.message}`);
    }
  } else {
    // Image file (JPEG, PNG, WebP)
    sourceType = 'IMAGE_OCR';
    if (onProgress) {
      onProgress({ phase: 'ocr_image', message: 'Processing image through optical character recognition...', percent: 30 });
    }

    fullText = await recognizeImageText(file, { onProgress, signal });
    pages = [{ pageNumber: 1, text: fullText }];
    pageCount = 1;
  }

  if (signal?.aborted) {
    throw new Error('OCR operation cancelled by user.');
  }

  if (onProgress) {
    onProgress({ phase: 'field_extraction', message: 'Extracting financial entities & validating fields...', percent: 90 });
  }

  // Deterministic field extraction across all recognized text
  const extractedFields = extractFdrFields(fullText, 1);
  const words = fullText.trim().split(/\s+/).filter(Boolean);

  if (onProgress) {
    onProgress({ phase: 'done', message: 'Document intelligence analysis complete.', percent: 100 });
  }

  return {
    sourceType,
    fullText,
    pages,
    extractedFields,
    extractionMetadata: {
      sourceType,
      fileName,
      pageCount,
      wordCount: words.length,
      isUnreadable: words.length < 10,
      rawSampleSnippet: fullText.slice(0, 150),
      processingDurationMs: Date.now() - startTime,
    },
  };
}
