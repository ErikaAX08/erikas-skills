-- Nullable with no default: on PostgreSQL 11+ this only updates the catalog (no table rewrite).
-- lock_timeout bounds the wait for the brief ACCESS EXCLUSIVE lock so writes never queue behind it.
SET lock_timeout = '5s';
ALTER TABLE orders ADD COLUMN gift_note TEXT;
