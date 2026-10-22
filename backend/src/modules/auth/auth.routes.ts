import { Router, Request, Response, NextFunction } from 'express';
import { sql, eq } from 'drizzle-orm';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { db } from '../../db';
import { documents } from '../../db/schema';

export const authRouter = Router();

authRouter.use(authMiddleware);

authRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Count user's current documents for quota tracking (max 10)
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.userId, user.id));

    const documentCount = Number(result[0]?.count ?? 0);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
      quota: {
        maxDocuments: 10,
        usedDocuments: documentCount,
        remainingDocuments: Math.max(0, 10 - documentCount),
      },
    });
  } catch (error) {
    next(error);
  }
});
