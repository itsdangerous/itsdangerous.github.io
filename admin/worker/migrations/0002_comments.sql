CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  nickname TEXT NOT NULL,
  body TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX comments_page_created ON comments(page, created_at, id);
CREATE TABLE comment_likes (
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  PRIMARY KEY(comment_id, visitor_hash)
);
CREATE TABLE comment_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX comment_rate_expiry ON comment_rate_limits(expires_at);
