# Deploying

1. CI builds the `api` and `worker` images on every merge to `main`.
2. `make deploy` performs a rolling update of the `api` and `worker` containers. Old and new
   containers run side by side for up to 10 minutes while the rollout completes.
3. Migrations are never run by `make deploy`. The on-call engineer runs `make migrate` by hand,
   at the point the release ticket specifies.
