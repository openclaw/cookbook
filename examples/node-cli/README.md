# Node CLI Example

A small command-line wrapper around the cookbook recipes.

```bash
pnpm example:node-cli run "Say hello"
pnpm example:node-cli stream "Explain this branch"
pnpm example:node-cli models
pnpm example:node-cli session
```

In a real app, keep the recipe functions as library code and make the CLI only
responsible for parsing arguments, output formatting, and exit codes.
