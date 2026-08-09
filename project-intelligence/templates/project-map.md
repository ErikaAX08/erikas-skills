<!--
Target: .ai/project-map.md
Where each responsibility is implemented. Paths and responsibilities only — no explanation
(that is architecture.md) and no duplication of the data model (that is database.md).
This is the document consulted first for "where is X?" and before every impact analysis,
so completeness of the entries matters more than prose. Add a line the moment you locate
something the map did not have.
-->

# Project Map

**Last verified:** <YYYY-MM-DD>

## Conventions

<!-- The rules a newcomer would otherwise have to infer from twenty files. -->

- Module layout: `<pattern, e.g. src/modules/<domain>/{controllers,services,repositories}>`
- Tests live: `<pattern>`
- Naming: `<e.g. *.use-case.ts for application services, *.adapter.ts for outbound ports>`
- Shared code: `<path>`
- Generated code (do not edit): `<paths>`

## Cross-cutting

| Concern              | Location  |
| -------------------- | --------- |
| Application bootstrap| `<path>`  |
| Routing / registry   | `<path>`  |
| Configuration loading| `<path>`  |
| Database client      | `<path>`  |
| Error handling       | `<path>`  |
| Logging              | `<path>`  |
| Authentication       | `<path>`  |
| Authorization        | `<path>`  |
| Validation           | `<path>`  |
| Event bus            | `<path>`  |
| Background jobs      | `<path>`  |
| Migrations / seeds   | `<path>`  |
| Infrastructure code  | `<path>`  |
| CI/CD                | `<path>`  |

---

## <Domain, e.g. Authentication>

| Responsibility          | Location   |
| ----------------------- | ---------- |
| HTTP entry points       | `<path>`   |
| Application logic       | `<path>`   |
| Domain logic            | `<path>`   |
| Persistence             | `<path>`   |
| External integration    | `<path>`   |
| Events emitted          | `<path>`   |
| Background work         | `<path>`   |
| Tests                   | `<path>`   |
| Related flows           | `flows/<flow>.md` |

<!-- Repeat one section per domain. Only domains actually located: an empty section
     claims coverage that does not exist. -->

---

## Not Yet Mapped

- `<path or domain>` — <why it has not been mapped, and whether it matters>
