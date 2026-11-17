# Orders service

Production runs on PostgreSQL 15 (engine version pinned in `infra/postgres.tf`). The `orders` table
holds about 80 million rows and receives writes continuously.

Deploys are rolling: the pipeline applies `db/migrations` first, then replaces app containers a few
at a time, so the previous and the new app version serve traffic side by side for several minutes.
A migration that fails (including on `lock_timeout`) stops the pipeline before any container changes
and is retried by re-running the deploy.

Run the tests with `python3 -m unittest discover -s tests` (SQLite in memory, no dependencies).
