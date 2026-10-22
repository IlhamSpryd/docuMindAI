import { AppError } from '../../utils/app-error';

export interface ExtractedPage {
  pageNumber: number; // 1-indexed
  text: string;
}

export function assertValidPdfBuffer(
  buffer: Buffer,
  maxBytes = 10 * 1024 * 1024
): void {
  if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
    throw new AppError(
      413,
      'FILE_TOO_LARGE',
      'Ukuran file PDF melebihi batas maksimal 10 MB.'
    );
  }

  const magicHeader = buffer.subarray(0, 5).toString('ascii');
  if (magicHeader !== '%PDF-') {
    throw new AppError(
      400,
      'INVALID_FILE_TYPE',
      'File bukan dokumen PDF yang valid (magic bytes mismatch).'
    );
  }
}

export async function extractPagesFromPdf(
  buffer: Buffer,
  options?: { maxPages?: number; minChars?: number }
): Promise<ExtractedPage[]> {
  assertValidPdfBuffer(buffer);

  const maxPages = options?.maxPages ?? 50;
  const minChars = options?.minChars ?? 50;

  // Dynamically import pdfjs-dist legacy build to ensure Node compatibility
  let pdfjsLib: any;
  try {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch (e: any) {
      throw new AppError(500, 'PDF_PARSER_INIT_ERROR', `Gagal memuat modul parser PDF: ${e?.message}`);
    }
  }

  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages > maxPages) {
    throw new AppError(
      400,
      'PAGE_LIMIT_EXCEEDED',
      `Jumlah halaman dokumen (${numPages}) melebihi batas maksimal ${maxPages} halaman.`
    );
  }

  const extractedPages: ExtractedPage[] = [];
  let totalNonWhitespaceChars = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Sort items top-to-bottom, left-to-right
    const items = (textContent.items as any[]).filter((item) => item.str && item.str.trim());

    items.sort((a, b) => {
      // transform[5] is vertical (y), transform[4] is horizontal (x)
      const yA = a.transform?.[5] ?? 0;
      const yB = b.transform?.[5] ?? 0;
      const xA = a.transform?.[4] ?? 0;
      const xB = b.transform?.[4] ?? 0;

      // Higher y means higher up on the page
      if (Math.abs(yA - yB) > 4) {
        return yB - yA;
      }
      return xA - xB;
    });

    let pageRawText = '';
    let lastY: number | null = null;

    for (const item of items) {
      const currentY = item.transform?.[5] ?? 0;
      if (lastY !== null && Math.abs(lastY - currentY) > 8) {
        pageRawText += '\n';
      } else if (pageRawText.length > 0 && !pageRawText.endsWith(' ') && !pageRawText.endsWith('\n')) {
        pageRawText += ' ';
      }
      pageRawText += item.str;
      lastY = currentY;
    }

    // Clean up page resources in memory
    page.cleanup();

    // Text normalization
    const cleanedText = pageRawText
      .replace(/\u0000/g, '') // remove null characters
      .replace(/[ \t]+/g, ' ') // collapse horizontal spaces
      .replace(/\n{3,}/g, '\n\n') // collapse multiple newlines
      .trim();

    totalNonWhitespaceChars += cleanedText.replace(/\s/g, '').length;

    extractedPages.push({
      pageNumber: pageNum,
      text: cleanedText,
    });
  }

  if (totalNonWhitespaceChars < minChars) {
    throw new AppError(
      400,
      'EMPTY_EXTRACTED_TEXT',
      'Dokumen PDF tidak memuat teks yang dapat diekstraksi (kemungkinan berupa hasil pemindaian/gambar yang membutuhkan OCR).'
    );
  }

  return extractedPages;
}
