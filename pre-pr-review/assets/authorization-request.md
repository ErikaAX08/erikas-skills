Environment and resource: <account/region/log group or host/database>
Intended identity: <profile/role/user, no secrets>
Hypothesis: <what is being verified>
Operation: <exact query or command, with sensitive values redacted>
Scope: <tables/columns or log groups/fields>
Limits: <time window, rows, timeout, and expected volume>
Sensitive data: <none, or categories that could appear>

Present this block, wait for explicit authorization, and stop on any mismatch with the
approval. One approval covers exactly one resource, environment, operation, and range.
