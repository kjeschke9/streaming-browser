import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, pinSchema, tagSchema, hideTitleSchema, syncSchema } from '../middleware/validate';
import * as profileService from '../services/profileService';

const router = Router();
router.use(authenticate);

// GET /api/profile
router.get('/', async (req: AuthRequest, res) => {
  try {
    const profile = await profileService.getProfile(req.userId!);
    res.json({ ok: true, data: profile });
  } catch (err) {
    res.status(404).json({ ok: false, error: 'Profile not found' });
  }
});

// PATCH /api/profile
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const profile = await profileService.updateProfile(req.userId!, req.body);
    res.json({ ok: true, data: profile });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Update failed' });
  }
});

// PUT /api/profile/service-toggles
router.put('/service-toggles', async (req: AuthRequest, res) => {
  try {
    const profile = await profileService.updateServiceToggles(req.userId!, req.body.toggles ?? req.body);
    res.json({ ok: true, data: profile });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to update service toggles' });
  }
});

// POST /api/profile/sync
router.post('/sync', validate(syncSchema), async (req: AuthRequest, res) => {
  try {
    const result = await profileService.syncProfile(req.userId!, req.body);
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Sync failed' });
  }
});

// ─── Safe Feed ────────────────────────────────────────────────────────────────
router.get('/safe-feed', async (req: AuthRequest, res) => {
  try {
    const sf = await profileService.updateSafeFeed(req.userId!, {});
    res.json({ ok: true, data: sf });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed' });
  }
});

router.patch('/safe-feed', async (req: AuthRequest, res) => {
  try {
    const sf = await profileService.updateSafeFeed(req.userId!, req.body);
    res.json({ ok: true, data: sf });
  } catch {
    res.status(500).json({ ok: false, error: 'Update failed' });
  }
});

router.post('/safe-feed/pin', validate(pinSchema), async (req: AuthRequest, res) => {
  try {
    await profileService.setPIN(req.userId!, req.body.pin);
    res.json({ ok: true, data: null, message: 'PIN set successfully' });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to set PIN' });
  }
});

router.post('/safe-feed/verify-pin', validate(pinSchema), async (req: AuthRequest, res) => {
  try {
    const valid = await profileService.verifyPIN(req.userId!, req.body.pin);
    res.json({ ok: true, data: { valid } });
  } catch {
    res.status(500).json({ ok: false, error: 'Verification failed' });
  }
});

// ─── Exclusion Tags ───────────────────────────────────────────────────────────
router.post('/exclusions/tags', validate(tagSchema), async (req: AuthRequest, res) => {
  try {
    await profileService.addExclusionTag(req.userId!, req.body.tag);
    const profile = await profileService.getProfile(req.userId!);
    res.status(201).json({ ok: true, data: profile.exclusionSettings });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to add tag' });
  }
});

router.delete('/exclusions/tags/:tagId', async (req: AuthRequest, res) => {
  try {
    await profileService.removeExclusionTag(req.userId!, req.params['tagId']!);
    const profile = await profileService.getProfile(req.userId!);
    res.json({ ok: true, data: profile.exclusionSettings });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to remove tag' });
  }
});

// ─── Hidden Titles ────────────────────────────────────────────────────────────
router.get('/exclusions/hidden-titles', async (req: AuthRequest, res) => {
  try {
    const profile = await profileService.getProfile(req.userId!);
    res.json({ ok: true, data: profile.exclusionSettings.hiddenTitles });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed' });
  }
});

router.post('/exclusions/hidden-titles', validate(hideTitleSchema), async (req: AuthRequest, res) => {
  try {
    const { titleId, serviceId, titleSnapshot } = req.body;
    await profileService.hideTitle(req.userId!, titleId, serviceId, titleSnapshot);
    const profile = await profileService.getProfile(req.userId!);
    res.status(201).json({ ok: true, data: profile.exclusionSettings });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to hide title' });
  }
});

router.delete('/exclusions/hidden-titles/:hiddenId', async (req: AuthRequest, res) => {
  try {
    await profileService.unhideTitle(req.userId!, req.params['hiddenId']!);
    const profile = await profileService.getProfile(req.userId!);
    res.json({ ok: true, data: profile.exclusionSettings });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to unhide title' });
  }
});

export default router;
