# Custom Transport

Use an in-memory SDK transport to test app code without a real Gateway.

```bash
pnpm recipe:custom-transport -- "test prompt"
```

This pattern is useful for app tests: implement the SDK transport interface,
return canned RPC responses, and assert your app behavior around the SDK
boundary.
