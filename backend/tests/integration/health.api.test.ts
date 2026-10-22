import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Health & Global Error Boundary API (FR-OPS-002, TC-OPS-003)', () => {
  it('TC-OPS-003: should return 200 or 503 with standardized JSON health structure', async () => {
    const res = await request(app).get('/api/v1/health');

    // Either 200 (if DB active) or 503 (if DB offline in CI) with standard JSON
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('service', 'DocuMind AI API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return standardized 404 envelope for non-existent route without stack trace', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Rute GET /api/v1/non-existent-route tidak ditemukan.',
      },
    });
    expect(res.body).not.toHaveProperty('stack');
  });

  it('TC-AUTH-002: should reject unauthenticated request to private endpoint with 401', async () => {
    const res = await request(app).get('/api/v1/documents');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
