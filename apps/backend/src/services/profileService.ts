import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import type { UserProfile, SyncPayload, SyncResult } from '@streambrws/shared-types';

export async function getProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      profile: true,
      exclusionTags: true,
      hiddenTitles: true,
      safeFeedConfig: true,
    },
  });

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    serviceToggles: (user.profile?.serviceToggles ?? {}) as UserProfile['serviceToggles'],
    exclusionSettings: {
      tags: user.exclusionTags.map(t => ({
        id: t.id,
        userId: t.userId,
        tag: t.tag,
        createdAt: t.createdAt.toISOString(),
      })),
      hiddenTitles: user.hiddenTitles.map(h => ({
        id: h.id,
        userId: h.userId,
        titleId: h.titleId,
        serviceId: h.serviceId as any,
        titleSnapshot: h.titleSnapshot,
        hiddenAt: h.hiddenAt.toISOString(),
      })),
      hiddenTitleSearchEnabled: user.profile?.hiddenTitleSearchEnabled ?? false,
      lastSyncedAt: user.profile?.lastSyncedAt?.toISOString(),
    },
    safeFeed: {
      enabled: user.safeFeedConfig?.enabled ?? false,
      hasPinSet: !!user.safeFeedConfig?.pinHash,
      allowedServiceIds: (user.safeFeedConfig?.allowedServiceIds ?? []) as any,
      allowedTags: (user.safeFeedConfig?.allowedTags ?? []) as string[],
    },
  };
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string; avatarUrl?: string }
): Promise<UserProfile> {
  await prisma.user.update({ where: { id: userId }, data: patch });
  return getProfile(userId);
}

export async function updateServiceToggles(
  userId: string,
  toggles: Record<string, boolean>
): Promise<UserProfile> {
  await prisma.userProfile.upsert({
    where: { userId },
    update: { serviceToggles: toggles },
    create: { userId, serviceToggles: toggles },
  });
  return getProfile(userId);
}

export async function setPIN(userId: string, pin: string): Promise<void> {
  const pinHash = await bcrypt.hash(pin, env.BCRYPT_ROUNDS);
  await prisma.safeFeedConfig.upsert({
    where: { userId },
    update: { pinHash },
    create: { userId, pinHash },
  });
}

export async function verifyPIN(userId: string, pin: string): Promise<boolean> {
  const cfg = await prisma.safeFeedConfig.findUnique({ where: { userId } });
  if (!cfg?.pinHash) return false;
  return bcrypt.compare(pin, cfg.pinHash);
}

export async function updateSafeFeed(
  userId: string,
  patch: {
    enabled?: boolean;
    allowedServiceIds?: string[];
    allowedTags?: string[];
  }
): Promise<UserProfile['safeFeed']> {
  const updated = await prisma.safeFeedConfig.upsert({
    where: { userId },
    update: patch,
    create: { userId, ...patch },
  });
  return {
    enabled: updated.enabled,
    hasPinSet: !!updated.pinHash,
    allowedServiceIds: (updated.allowedServiceIds ?? []) as any,
    allowedTags: (updated.allowedTags ?? []) as string[],
  };
}

export async function addExclusionTag(userId: string, tag: string): Promise<void> {
  await prisma.exclusionTag.upsert({
    where: { userId_tag: { userId, tag } },
    update: {},
    create: { userId, tag },
  });
}

export async function removeExclusionTag(userId: string, tagId: string): Promise<void> {
  await prisma.exclusionTag.deleteMany({ where: { id: tagId, userId } });
}

export async function hideTitle(
  userId: string,
  titleId: string,
  serviceId: string,
  titleSnapshot: string
): Promise<void> {
  await prisma.hiddenTitle.upsert({
    where: { userId_titleId_serviceId: { userId, titleId, serviceId } },
    update: {},
    create: { userId, titleId, serviceId, titleSnapshot },
  });
}

export async function unhideTitle(userId: string, hiddenId: string): Promise<void> {
  await prisma.hiddenTitle.deleteMany({ where: { id: hiddenId, userId } });
}

export async function syncProfile(
  userId: string,
  payload: SyncPayload
): Promise<SyncResult> {
  const serverProfile = await getProfile(userId);
  const conflicts: string[] = [];

  // Merge service toggles
  const mergedToggles = { ...serverProfile.serviceToggles, ...payload.serviceToggles };

  // Merge exclusion tags (union by tag value)
  const serverTagSet = new Map(serverProfile.exclusionSettings.tags.map(t => [t.tag, t]));
  for (const ct of payload.exclusionSettings.tags) {
    if (!serverTagSet.has(ct.tag)) {
      await addExclusionTag(userId, ct.tag);
    }
  }

  // Merge hidden titles
  const serverHiddenSet = new Map(
    serverProfile.exclusionSettings.hiddenTitles.map(h => [`${h.titleId}:${h.serviceId}`, h])
  );
  for (const ch of payload.exclusionSettings.hiddenTitles) {
    const key = `${ch.titleId}:${ch.serviceId}`;
    if (!serverHiddenSet.has(key)) {
      await hideTitle(userId, ch.titleId, ch.serviceId as string, ch.titleSnapshot);
    }
  }

  // Update service toggles
  await updateServiceToggles(userId, mergedToggles as Record<string, boolean>);

  // Update safe feed
  await updateSafeFeed(userId, {
    enabled: payload.safeFeedConfig.enabled,
    allowedServiceIds: payload.safeFeedConfig.allowedServiceIds,
    allowedTags: payload.safeFeedConfig.allowedTags,
  });

  // Update lastSyncedAt
  const now = new Date();
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      hiddenTitleSearchEnabled: payload.exclusionSettings.hiddenTitleSearchEnabled,
      lastSyncedAt: now,
    },
    create: {
      userId,
      hiddenTitleSearchEnabled: payload.exclusionSettings.hiddenTitleSearchEnabled,
      lastSyncedAt: now,
    },
  });

  const merged = await getProfile(userId);
  return {
    merged: {
      serviceToggles: merged.serviceToggles,
      exclusionSettings: merged.exclusionSettings,
      safeFeedConfig: merged.safeFeed,
      clientTimestamp: now.toISOString(),
    },
    serverTimestamp: now.toISOString(),
    conflicts,
  };
}
