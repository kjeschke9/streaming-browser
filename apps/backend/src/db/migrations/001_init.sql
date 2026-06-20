-- StreamBrws reference schema (Prisma manage actual migrations)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, display_name TEXT NOT NULL,
    avatar_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), revoked BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);
CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_toggles JSONB DEFAULT '{}', hidden_title_search_enabled BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS exclusion_tags (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_et_user ON exclusion_tags(user_id);
CREATE TABLE IF NOT EXISTS hidden_titles (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_id TEXT NOT NULL, service_id TEXT NOT NULL, title_snapshot TEXT NOT NULL,
    hidden_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, title_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_ht_user ON hidden_titles(user_id);
CREATE TABLE IF NOT EXISTS safe_feed_configs (
    id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT FALSE, pin_hash TEXT,
    allowed_service_ids JSONB DEFAULT '[]', allowed_tags JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
