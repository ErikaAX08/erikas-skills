# Orders service

Production runs on a managed PostgreSQL instance provisioned from the separate `infra` repository;
its engine version is pinned there, not here. The `orders` table holds about 80 million rows and
receives writes continuously (checkout traffic never pauses).

Migrations in `db/migrations` are applied automatically by the deploy pipeline before the new code
is rolled out.
