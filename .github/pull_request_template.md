<!-- Usa Conventional Commits en el título: feat/fix/docs/chore/refactor/test -->
<!-- Este template se auto-aplica al crear el PR. Bórralo si no aplica. -->

## Qué cambia

<!-- Resumen en 1-3 líneas -->

## Por qué

<!-- Contexto / issue relacionado: Closes #... -->

## Cómo se probó

- [ ] `pnpm run validate` pasa
- [ ] `pnpm pack --dry-run` revisado (si cambia `files` o `package.json`)
- [ ] Probado `npx erikas-skills install --dry-run --target claude`

## Checklist

- [ ] Título sigue Conventional Commits
- [ ] `pnpm run sync:versions` ejecutado si cambió `version`
- [ ] Docs actualizadas (README / SKILL.md) si aplica
- [ ] No se listan rutas de archivos como "cambios" — se describe comportamiento

## Breaking changes

<!-- Si hay, describe migración. Si no, borra esta sección. -->
