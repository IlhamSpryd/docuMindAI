import pino from 'pino';

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'apiKey',
  'api_key',
  'geminiApiKey',
  'GEMINI_API_KEY',
  'supabaseKey',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'secret',
];

export const redactSecrets = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSecrets);
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSecrets(value);
    } else if (typeof value === 'string' && (value.startsWith('Bearer ') || value.startsWith('eyJhbG'))) {
      result[key] = '[REDACTED_TOKEN]';
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'authorization',
      'password',
      'token',
      'apiKey',
      'gemini_api_key',
      'supabase_key',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
