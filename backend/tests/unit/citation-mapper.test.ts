import { describe, it, expect } from 'vitest';
import {
  mapAndValidateCitations,
  RetrievedChunkRecord,
} from '../../src/modules/conversations/citation-mapper';

describe('Deterministic Citation Mapper (FR-CIT-001, FR-RAG-002)', () => {
  const mockChunks: RetrievedChunkRecord[] = [
    {
      id: 'chunk-1-uuid',
      documentId: 'doc-1',
      chunkIndex: 0,
      pageNumber: 3,
      content: 'Teks halaman tiga mengenai metodologi.',
      similarityScore: 0.88,
    },
    {
      id: 'chunk-2-uuid',
      documentId: 'doc-1',
      chunkIndex: 1,
      pageNumber: 7,
      content: 'Teks halaman tujuh mengenai hasil evaluasi.',
      similarityScore: 0.76,
    },
  ];

  it('TC-CIT-001: should map valid inline and explicit cited source indices deterministically', () => {
    const rawOutput = {
      answer: 'Metodologi dijelaskan pada [1], sedangkan evaluasi ada pada [2].',
      isAbstention: false,
      citedSourceIndices: [1, 2],
    };

    const result = mapAndValidateCitations(rawOutput, mockChunks, 'Paper Riset.pdf');

    expect(result.isAbstention).toBe(false);
    expect(result.sources).toHaveLength(2);

    expect(result.sources[0].citationOrder).toBe(1);
    expect(result.sources[0].sourceIndex).toBe(1);
    expect(result.sources[0].pageNumber).toBe(3);
    expect(result.sources[0].snippet).toBe('Teks halaman tiga mengenai metodologi.');
    expect(result.sources[0].documentTitle).toBe('Paper Riset.pdf');

    expect(result.sources[1].citationOrder).toBe(2);
    expect(result.sources[1].sourceIndex).toBe(2);
    expect(result.sources[1].pageNumber).toBe(7);
  });

  it('TC-CIT-002: should filter out hallucinated out-of-bounds indices and strip invalid tags', () => {
    const rawOutput = {
      answer: 'Klaim ini merujuk pada [1] dan sumber palsu [99].',
      isAbstention: false,
      citedSourceIndices: [1, 99], // 99 is invalid since chunks length is 2
    };

    const result = mapAndValidateCitations(rawOutput, mockChunks, 'Paper Riset.pdf');

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].sourceIndex).toBe(1);
    expect(result.answer).not.toContain('[99]');
    expect(result.answer).toContain('[1]');
  });

  it('TC-RAG-002: should short-circuit to abstention when LLM outputs isAbstention=true', () => {
    const rawOutput = {
      answer: 'Informasi tidak ada di dokumen. [1]',
      isAbstention: true,
      citedSourceIndices: [1],
    };

    const result = mapAndValidateCitations(rawOutput, mockChunks, 'Paper Riset.pdf');

    expect(result.isAbstention).toBe(true);
    expect(result.sources).toHaveLength(0);
    expect(result.answer).not.toContain('[1]');
  });

  it('TC-RAG-003: should short-circuit to abstention if retrieved chunks list is empty', () => {
    const rawOutput = {
      answer: 'Jawaban spekulatif.',
      isAbstention: false,
      citedSourceIndices: [1],
    };

    const result = mapAndValidateCitations(rawOutput, [], 'Paper Riset.pdf');

    expect(result.isAbstention).toBe(true);
    expect(result.sources).toHaveLength(0);
  });
});
