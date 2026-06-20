-- Migration 002: Add watchlist table
-- Run after 001_init.sql

CREATE TABLE IF NOT EXISTS watchlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id   UUID        NOT NULL REFERENCES title_cache(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, title_id)
);

CREATE INDEX IF NOT EXISTS watchlist_user_idx ON watchlist (user_id, added_at DESC);
