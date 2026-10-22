import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim() ? incomingId : uuidv4();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
