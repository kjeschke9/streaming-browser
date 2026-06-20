import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Common schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(64),
});

export const pinSchema = z.object({
  pin: z.string().min(4).max(8).regex(/^\d+$/, 'PIN must be numeric'),
});

export const tagSchema = z.object({
  tag: z.string().min(1).max(64).toLowerCase(),
});

export const hideTitleSchema = z.object({
  titleId: z.string().min(1),
  serviceId: z.string().min(1),
  titleSnapshot: z.string().min(1),
});

export const syncSchema = z.object({
  serviceToggles: z.record(z.boolean()),
  exclusionSettings: z.object({
    tags: z.array(z.any()),
    hiddenTitles: z.array(z.any()),
    hiddenTitleSearchEnabled: z.boolean(),
    lastSyncedAt: z.string().optional(),
  }),
  safeFeedConfig: z.object({
    enabled: z.boolean(),
    hasPinSet: z.boolean(),
    allowedServiceIds: z.array(z.string()),
    allowedTags: z.array(z.string()),
  }),
  clientTimestamp: z.string(),
});
