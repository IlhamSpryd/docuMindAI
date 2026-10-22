import { describe, it, expect } from 'vitest';
import { redactSecrets } from '../../src/config/logger';

describe('Logger Secret Redaction (FR-OPS-002, TC-OPS-004)', () => {
  it('should redact sensitive keys and JWT Bearer tokens from objects', () => {
    const sensitivePayload = {
      user: 'john_doe',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      apiKey: 'AIzaSySecretGeminiKey123',
      nested: {
        password: 'my-super-secret-password',
        token: 'secret-refresh-token',
        safeProperty: 'public-data',
      },
    };

    const redacted = redactSecrets(sensitivePayload);

    expect(redacted.user).toBe('john_doe');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.nested.password).toBe('[REDACTED]');
    expect(redacted.nested.token).toBe('[REDACTED]');
    expect(redacted.nested.safeProperty).toBe('public-data');
  });
});
