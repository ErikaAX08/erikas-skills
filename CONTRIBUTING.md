# Contributing

## Requisitos

- Node >= 18, pnpm >= 9 (`corepack enable pnpm`)

## Flujo

```bash
pnpm install
pnpm run validate          # frontmatter + versiones sincronizadas
pnpm run sync:versions     # si cambias version en el root
pnpm pack --dry-run        # qué entra en el tarball
npx erikas-skills install --dry-run --target claude
```

## Reglas

- Una skill = una carpeta top-level con `SKILL.md` (con frontmatter `name`/`description`) + `package.json` (`@erikaax/<carpeta>`).
- Spec Kit es atómico: no se publica una skill suelta del kit. Usa `@erikaax/spec-kit` (incluye 7 skills + `spec-kit-shared`).
- Si tocas `version` en `package.json` raíz, corre `pnpm run sync:versions` para propagar a los 14 workspaces.
- Commits y títulos de PR en [Conventional Commits](https://www.conventionalcommits.org/).
- No listes rutas de archivos como "cambios" en el PR — describe comportamiento.

## Publicar

```bash
pnpm -r publish --access public   # skills + spec-kit
pnpm publish --access public      # bundle erikas-skills
# o pushea un tag v* y el workflow .github/workflows/release.yml lo hace
```

## Reporte de bugs / propuestas

Usa las plantillas de issue en `.github/ISSUE_TEMPLATE/`.
