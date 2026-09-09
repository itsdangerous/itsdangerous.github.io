ALTER TABLE comments ADD COLUMN parent_id TEXT REFERENCES comments(id);
CREATE INDEX comments_parent_created ON comments(parent_id, created_at, id);
