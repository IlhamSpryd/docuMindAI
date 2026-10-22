import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),

  SUPABASE_URL: z.string().url('SUPABASE_URL harus berupa URL valid'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY wajib diisi'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY wajib diisi'),
  SUPABASE_STORAGE_BUCKET: z.string().default('documents'),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  GEMINI_LLM_MODEL: z.string().default('gemini-2.5-flash'),

  AI_PROVIDER: z.enum(['gemini', 'mock']).default('gemini'),
  EMBEDDING_BATCH_DELAY_MS: z.coerce.number().default(250),
});

// Provide safe defaults in test environment before parsing
if (process.env.NODE_ENV === 'test') {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test';
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
  process.env.AI_PROVIDER = 'mock';
}

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment Variable Validation Error:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test',
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://test.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key',
      AI_PROVIDER: 'mock',
    });
