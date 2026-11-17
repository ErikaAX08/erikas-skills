# Payment provider notes

`POST /v1/charges` can time out on our side after the provider has already captured the charge.
Any retry of a charge must send the same `Idempotency-Key` header as the first attempt; the provider
then returns the original charge instead of creating a second one. Without the header every request
is a new charge.
