import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ ok: false, error: message });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ ok: false, error: 'Route not found' });
}
