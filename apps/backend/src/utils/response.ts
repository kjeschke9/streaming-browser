/**
 * response.ts — standardised JSON response helpers.
 */
import type { Response } from 'express';

export function ok(res: Response, data: object, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function created(res: Response, data: object) {
  return ok(res, data, 201);
}

export function notFound(res: Response, entity = 'Resource') {
  return res.status(404).json({ success: false, error: `${entity} not found` });
}

export function badRequest(res: Response, error: string) {
  return res.status(400).json({ success: false, error });
}

export function unauthorized(res: Response, error = 'Unauthorized') {
  return res.status(401).json({ success: false, error });
}

export function serverError(res: Response, err: any) {
  const message = err?.message ?? 'Internal server error';
  console.error('[ServerError]', message, err?.stack);
  return res.status(500).json({ success: false, error: message });
}
