import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_in_production';

export interface AuthPayload {
  id: string;
  email: string;
  username: string;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Missing auth token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
