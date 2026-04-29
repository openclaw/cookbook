# Recipes

Recipes are intentionally small. Each one demonstrates one SDK workflow and is
safe to copy into a real app.

Current recipes are listed in [`manifest.json`](manifest.json).

## Adding a Recipe

1. Create `recipes/<id>/README.md`.
2. Create `recipes/<id>/index.ts`.
3. Add the recipe to `recipes/manifest.json`.
4. Add test coverage in `test/recipes.test.ts`.
5. Run `pnpm check`.
