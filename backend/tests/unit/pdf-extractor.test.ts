import { describe, it, expect } from 'vitest';
import { assertValidPdfBuffer } from '../../src/modules/documents/pdf-extractor';
import { AppError } from '../../src/utils/app-error';

describe('PDF Extractor & Validator (FR-DOC-001, FR-PROC-001)', () => {
  it('TC-DOC-001: should pass validation for buffer with valid %PDF- magic bytes', () => {
    const validHeaderBuffer = Buffer.from('%PDF-1.7 Valid content');
    expect(() => assertValidPdfBuffer(validHeaderBuffer)).not.toThrow();
  });

  it('TC-DOC-002: should reject file without %PDF- magic bytes (MIME spoofing defense)', () => {
    const fakePdf = Buffer.from('MZ\x90\x00\x03Executable disguised as PDF');

    expect(() => assertValidPdfBuffer(fakePdf)).toThrow(AppError);
    try {
      assertValidPdfBuffer(fakePdf);
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
      expect(err.errorCode).toBe('INVALID_FILE_TYPE');
    }
  });

  it('TC-DOC-003: should reject file exceeding maximum size (10 MB)', () => {
    // 10 MB + 1 byte
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    oversizedBuffer.write('%PDF-');

    expect(() => assertValidPdfBuffer(oversizedBuffer)).toThrow(AppError);
    try {
      assertValidPdfBuffer(oversizedBuffer);
    } catch (err: any) {
      expect(err.statusCode).toBe(413);
      expect(err.errorCode).toBe('FILE_TOO_LARGE');
    }
  });

  it('should reject empty buffer (0 bytes)', () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(() => assertValidPdfBuffer(emptyBuffer)).toThrow(AppError);
  });
});
