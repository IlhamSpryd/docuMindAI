import { describe, it, expect } from 'vitest';
import {
  chunkDocumentPages,
  splitTextRecursively,
} from '../../src/modules/documents/page-chunker';

describe('Page-Aware Recursive Chunker (FR-PROC-002)', () => {
  it('TC-PROC-004: should maintain accurate page numbers and sequential chunk indices', () => {
    const pages = [
      {
        pageNumber: 1,
        text: 'Ini adalah kalimat pertama di halaman satu. '.repeat(10),
      },
      {
        pageNumber: 2,
        text: 'Ini adalah pengantar di halaman dua yang bersambung dari sebelumnya. '.repeat(15),
      },
    ];

    const chunks = chunkDocumentPages(pages, {
      targetChunkSize: 400,
      hardMaxChunkSize: 600,
      chunkOverlap: 50,
      crossPageBridgeSize: 40,
    });

    expect(chunks.length).toBeGreaterThan(1);

    // Verify sequential indexing
    chunks.forEach((chunk, idx) => {
      expect(chunk.chunkIndex).toBe(idx);
      expect(chunk.pageNumber).toBeGreaterThanOrEqual(1);
      expect(chunk.content.length).toBeLessThanOrEqual(600);
      expect(chunk.tokenEstimate).toBe(Math.max(1, Math.ceil(chunk.content.length / 4)));
    });

    // Verify first page chunks have pageNumber 1
    const page1Chunks = chunks.filter((c) => c.pageNumber === 1);
    expect(page1Chunks.length).toBeGreaterThan(0);

    // Verify second page chunks have pageNumber 2
    const page2Chunks = chunks.filter((c) => c.pageNumber === 2);
    expect(page2Chunks.length).toBeGreaterThan(0);
    // The first chunk of page 2 should contain bridge marker [...]
    expect(page2Chunks[0].content).toContain('[...]');
  });

  it('should not exceed hardMaxChunkSize', () => {
    const longText = 'Kata '.repeat(500);
    const result = splitTextRecursively(longText, 500, 100, 30);

    result.forEach((segment) => {
      expect(segment.length).toBeLessThanOrEqual(1000);
    });
  });
});
