import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { DocumentsRepository } from '../../src/modules/documents/documents.repository';

describe('Cross-User Data Isolation (FR-SEC-001, TC-SEC-001)', () => {
  const userAToken = 'mock-test-token-user-a';
  const userBToken = 'mock-test-token-user-b';
  const userAId = '00000000-0000-0000-0000-000000000001';
  const userBId = '00000000-0000-0000-0000-000000000002';
  const docAId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock findByIdScoped to simulate User A owning docAId
    vi.spyOn(DocumentsRepository.prototype, 'findByIdScoped').mockImplementation(
      async (id: string, userId: string) => {
        if (id === docAId && userId === userAId) {
          return {
            id: docAId,
            userId: userAId,
            title: 'Doc User A',
            originalFilename: 'doc-a.pdf',
            storagePath: `${userAId}/${docAId}.pdf`,
            mimeType: 'application/pdf',
            fileSizeBytes: 1024,
            pageCount: 2,
            status: 'ready' as const,
            errorCode: null,
            errorMessage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        // If accessed by User B or unknown ID, return null (scoped rejection)
        return null;
      }
    );
  });

  it('TC-SEC-001: User B accessing non-owned document should receive 404 Not Found', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${docAId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('User B attempting to retry document owned by User A should be rejected with 404', async () => {
    const res = await request(app)
      .post(`/api/v1/documents/${docAId}/retry`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('User B attempting to delete document owned by User A should be rejected with 404', async () => {
    const res = await request(app)
      .delete(`/api/v1/documents/${docAId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
  });

  it('User A should be able to access their own document', async () => {
    const res = await request(app)
      .get(`/api/v1/documents/${docAId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.document.id).toBe(docAId);
  });
});
