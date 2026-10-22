import { ExtractedPage } from './pdf-extractor';

export interface DocumentChunkDraft {
  chunkIndex: number; // 0-indexed global sequence
  pageNumber: number; // 1-indexed primary provenance page
  content: string;
  tokenEstimate: number; // Math.ceil(content.length / 4)
}

export interface ChunkerOptions {
  targetChunkSize?: number;
  hardMaxChunkSize?: number;
  chunkOverlap?: number;
  crossPageBridgeSize?: number;
  minChunkSize?: number;
}

export function splitTextRecursively(
  text: string,
  targetSize = 800,
  overlap = 150,
  minSize = 30
): string[] {
  if (text.length <= targetSize) {
    return [text];
  }

  const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' ', ''];
  let chosenSeparator = '';

  for (const sep of separators) {
    if (sep === '' || text.includes(sep)) {
      chosenSeparator = sep;
      break;
    }
  }

  const rawSplits = chosenSeparator === '' ? text.split('') : text.split(chosenSeparator);
  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < rawSplits.length; i++) {
    const part = rawSplits[i];
    const piece = currentChunk.length === 0 ? part : `${currentChunk}${chosenSeparator}${part}`;

    if (piece.length <= targetSize) {
      currentChunk = piece;
    } else {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }

      // Compute overlap from previous chunk
      if (overlap > 0 && currentChunk.length > overlap) {
        const tail = currentChunk.slice(-overlap);
        const lastSpace = tail.indexOf(' ');
        const overlapText = lastSpace !== -1 ? tail.slice(lastSpace + 1) : tail;
        currentChunk = `${overlapText}${chosenSeparator}${part}`.trim();
      } else {
        currentChunk = part.trim();
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Handle tiny trailing chunk by merging with previous chunk if within limits
  if (chunks.length > 1) {
    const lastChunk = chunks[chunks.length - 1];
    if (lastChunk.length < minSize) {
      const prevChunk = chunks[chunks.length - 2];
      if (prevChunk.length + lastChunk.length + 1 <= 1000) {
        chunks[chunks.length - 2] = `${prevChunk} ${lastChunk}`.trim();
        chunks.pop();
      }
    }
  }

  return chunks;
}

export function chunkDocumentPages(
  pages: ExtractedPage[],
  options: ChunkerOptions = {}
): DocumentChunkDraft[] {
  const targetSize = options.targetChunkSize ?? 800;
  const hardMax = options.hardMaxChunkSize ?? 1000;
  const overlap = options.chunkOverlap ?? 150;
  const bridgeSize = options.crossPageBridgeSize ?? 100;
  const minSize = options.minChunkSize ?? 30;

  const allChunks: DocumentChunkDraft[] = [];
  let globalChunkIndex = 0;
  let previousPageTail = '';

  for (const page of pages) {
    const cleanText = page.text.trim();
    if (!cleanText) {
      continue;
    }

    const rawPageSegments = splitTextRecursively(cleanText, targetSize, overlap, minSize);

    for (let i = 0; i < rawPageSegments.length; i++) {
      let segmentContent = rawPageSegments[i];

      // Cross-page context bridge for the first chunk of a new page
      if (i === 0 && previousPageTail.length > 0) {
        const bridged = `[...] ${previousPageTail} ${segmentContent}`.trim();
        if (bridged.length <= hardMax) {
          segmentContent = bridged;
        }
      }

      // Hard max limit safeguard
      if (segmentContent.length > hardMax) {
        segmentContent = segmentContent.slice(0, hardMax);
      }

      allChunks.push({
        chunkIndex: globalChunkIndex++,
        pageNumber: page.pageNumber,
        content: segmentContent,
        tokenEstimate: Math.max(1, Math.ceil(segmentContent.length / 4)),
      });
    }

    // Save tail for next page's bridge
    previousPageTail = cleanText.slice(-bridgeSize).trim();
  }

  return allChunks;
}
