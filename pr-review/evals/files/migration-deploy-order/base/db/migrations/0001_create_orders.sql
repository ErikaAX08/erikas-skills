CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  legacy_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
