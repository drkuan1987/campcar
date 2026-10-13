CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('dev', 'wechat')),
  provider_subject text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE TABLE IF NOT EXISTS entries (
  kind text NOT NULL CHECK (kind IN ('roadbooks', 'campsites', 'moments')),
  id text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, id)
);

CREATE INDEX IF NOT EXISTS entries_feed_idx ON entries (kind, created_at DESC);
CREATE INDEX IF NOT EXISTS entries_owner_idx ON entries (owner_id, kind, created_at DESC);
