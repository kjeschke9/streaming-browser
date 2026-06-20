import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { env } from '../config/env';
import type { AuthTokens } from '@streambrws/shared-types';

function signAccess(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

function signRefresh(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES as any });
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<AuthTokens> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName,
      profile: {
        create: {
          serviceToggles: {
            netflix: true, hulu: true, hbo_max: true,
            disney_plus: true, amazon_prime: true, apple_tv: true,
            paramount_plus: true, peacock: true, showtime: true, starz: true,
          },
        },
      },
      safeFeedConfig: { create: {} },
    },
  });

  const accessToken  = signAccess(user.id);
  const refreshToken = signRefresh(user.id);
  const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function loginUser(email: string, password: string): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  const accessToken  = signAccess(user.id);
  const refreshToken = signRefresh(user.id);
  const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
  let payload: { sub: string };
  try {
    payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new Error('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new Error('Refresh token expired or revoked');
  }

  // Rotate token
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const accessToken  = signAccess(payload.sub);
  const refreshToken = signRefresh(payload.sub);
  const expiresAt    = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { token: refreshToken, userId: payload.sub, expiresAt } });
  return { accessToken, refreshToken, expiresIn: 900 };
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
}
