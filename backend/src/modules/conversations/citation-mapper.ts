import { RawLLMGradedOutput } from '../../adapters/ai/ai-provider.interface';

export interface RetrievedChunkRecord {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  similarityScore: number;
}

export interface ValidatedCitationSource {
  citationOrder: number; // 1..M
  sourceIndex: number; // 1..K
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  snippet: string;
  similarityScore: number;
}

export interface MappedAnswerResult {
  answer: string;
  isAbstention: boolean;
  sources: ValidatedCitationSource[];
}

const DEFAULT_ABSTENTION_MESSAGE =
  'Maaf, saya tidak menemukan informasi atau bukti yang cukup di dalam dokumen ini untuk menjawab pertanyaan tersebut.';

export function mapAndValidateCitations(
  rawOutput: RawLLMGradedOutput,
  retrievedChunks: RetrievedChunkRecord[],
  documentTitle: string
): MappedAnswerResult {
  // 1. If no chunks found or LLM explicitly abstains
  if (retrievedChunks.length === 0 || rawOutput.isAbstention) {
    const cleanAbstentionText =
      rawOutput.answer?.trim().replace(/\s*\[\d+\]/g, '') || DEFAULT_ABSTENTION_MESSAGE;

    return {
      answer: cleanAbstentionText,
      isAbstention: true,
      sources: [],
    };
  }

  const maxIndex = retrievedChunks.length;

  // 2. Extract indices from inline answer text [1], [2]
  const inlineIndices: number[] = [];
  const citationRegex = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = citationRegex.exec(rawOutput.answer || '')) !== null) {
    const parsed = Number.parseInt(match[1], 10);
    if (!Number.isNaN(parsed)) {
      inlineIndices.push(parsed);
    }
  }

  // 3. Combine explicit citedSourceIndices + inline, deduplicate and check bounds [1..K]
  const combinedCandidates = [...inlineIndices, ...(rawOutput.citedSourceIndices ?? [])];
  const validUniqueIndices: number[] = [];

  for (const idx of combinedCandidates) {
    if (
      Number.isInteger(idx) &&
      idx >= 1 &&
      idx <= maxIndex &&
      !validUniqueIndices.includes(idx)
    ) {
      validUniqueIndices.push(idx);
    }
  }

  // 4. Clean out-of-bounds indices (e.g. [99]) from answer text
  const sanitizedAnswer = (rawOutput.answer || '')
    .replace(/\[(\d+)\]/g, (fullMatch, numStr) => {
      const idx = Number.parseInt(numStr, 10);
      return idx >= 1 && idx <= maxIndex ? fullMatch : '';
    })
    .trim();

  // 5. Fallback: If answer is not abstention but LLM forgot citations, reference top-1 chunk
  if (validUniqueIndices.length === 0 && retrievedChunks.length > 0) {
    validUniqueIndices.push(1);
  }

  // 6. Map deterministically to DB records
  const validatedSources: ValidatedCitationSource[] = validUniqueIndices.map(
    (sourceIdx, arrayIdx) => {
      const targetChunk = retrievedChunks[sourceIdx - 1];
      return {
        citationOrder: arrayIdx + 1,
        sourceIndex: sourceIdx,
        chunkId: targetChunk.id,
        documentId: targetChunk.documentId,
        documentTitle,
        pageNumber: targetChunk.pageNumber,
        snippet: targetChunk.content,
        similarityScore: Number(targetChunk.similarityScore.toFixed(4)),
      };
    }
  );

  return {
    answer: sanitizedAnswer,
    isAbstention: false,
    sources: validatedSources,
  };
}
