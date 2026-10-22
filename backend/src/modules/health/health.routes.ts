import { Router, Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // Check DB readiness with quick SELECT 1 query
    await db.execute(sql`SELECT 1`);

    res.status(200).json({
      status: 'ok',
      service: 'DocuMind AI API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: 'connected',
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      service: 'DocuMind AI API',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error?.message || 'Database connection error',
    });
  }
});
