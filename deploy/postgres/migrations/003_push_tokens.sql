-- Migration 003: Push notification tokens
-- Run: psql $DATABASE_URL -f migrations/003_push_tokens.sql

CREATE TABLE IF NOT EXISTS push_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT 'unknown',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

COMMENT ON TABLE push_tokens IS 'Expo push tokens for iOS/Android notifications';
