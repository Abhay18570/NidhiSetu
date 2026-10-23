/**
 * NidhiSetu Document Intelligence — PDF Text Layer Extractor
 * Extracts native digital text layers from PDF documents using dynamic import of pdfjs-dist.
 * If no native text layer is present (scanned PDF), signals fallback to OCR rasterization.
 */

let pdfjsLibCache = null;

async function getPdfjs() {
  if (pdfjsLibCache) return pdfjsLibCache;
  try {
    const pdfjs = await import('pdfjs-dist');
    // Set standard worker CDN or bundled worker if available in browser
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc && typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '5.6.205'}/build/pdf.worker.min.mjs`;
    }
    pdfjsLibCache = pdfjs;
    return pdfjs;
  } catch (err) {
    console.warn('[NidhiSetu PDF] pdfjs-dist dynamic import error:', err);
    throw new Error('PDF extraction engine failed to load. ' + err.message);
  }
}

/**
 * Extracts native text from a PDF file or blob.
 *
 * @param {Blob|File|ArrayBuffer} fileOrBuffer
 * @param {Object} options - { maxPages: 5, onProgress: Function, signal: AbortSignal }
 * @returns {Promise<Object>} { hasTextLayer, fullText, pages: [{ pageNumber, text }], pageCount }
 */
export async function extractPdfText(fileOrBuffer, options = {}) {
  const maxPages = options.maxPages || 5;
  const onProgress = options.onProgress || null;
  const signal = options.signal || null;

  if (signal?.aborted) {
    throw new Error('PDF extraction cancelled by user.');
  }

  let arrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else if (fileOrBuffer?.arrayBuffer) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    throw new Error('Invalid file format for PDF extraction.');
  }

  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });

  if (signal) {
    signal.addEventListener('abort', () => {
      try {
        loadingTask.destroy();
      } catch {
        // ignore
      }
    });
  }

  const pdfDoc = await loadingTask.promise;
  const totalDocPages = pdfDoc.numPages;
  const pagesToProcess = Math.min(totalDocPages, maxPages);

  const pages = [];
  let combinedText = '';

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    if (signal?.aborted) {
      throw new Error('PDF extraction cancelled by user.');
    }

    if (onProgress) {
      onProgress({
        phase: 'reading_pdf_pages',
        currentPage: pageNum,
        totalPages: pagesToProcess,
        percent: Math.round((pageNum / pagesToProcess) * 40),
      });
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageStrings = textContent.items.map((item) => item.str || '').filter(Boolean);
    const pageText = pageStrings.join(' ').replace(/\s+/g, ' ').trim();

    pages.push({
      pageNumber: pageNum,
      text: pageText,
    });
    combinedText += (combinedText ? '\n\n' : '') + pageText;
  }

  // Determine if a usable native digital text layer exists
  // A scanned image wrapped in PDF typically has 0 or fewer than 20 characters
  const trimmed = combinedText.trim();
  const hasTextLayer = trimmed.length >= 35 && /[a-zA-Z]{3,}/.test(trimmed);

  return {
    hasTextLayer,
    fullText: combinedText,
    pages,
    pageCount: totalDocPages,
    pagesProcessed: pagesToProcess,
    pdfDoc, // Returned for potential canvas rendering fallback
  };
}

/**
 * Renders a PDF page to an offscreen HTMLCanvasElement for OCR processing
 *
 * @param {Object} pdfDoc - Loaded PDF document proxy
 * @param {number} pageNumber - 1-based page number
 * @param {number} scale - Rendering resolution scale (default 2.0 for clear OCR)
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderPdfPageToCanvas(pdfDoc, pageNumber = 1, scale = 2.0) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering is only supported in browser DOM environments.');
  }

  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d');

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas;
}
