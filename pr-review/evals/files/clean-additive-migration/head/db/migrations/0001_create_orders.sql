CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT      NOT NULL,
  total_cents BIGINT      NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
