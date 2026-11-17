# orders infra

`infra/` holds the production Postgres for the orders service. `make plan` runs
`terraform plan` against the `production` workspace; it needs AWS credentials that this
repository does not provide.
