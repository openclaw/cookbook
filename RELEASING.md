# Releasing the Cookbook

Cookbook ships source snapshots on GitHub, using
[`release-source.yml@v1`](https://github.com/openclaw/release-workflows/blob/v1/.github/workflows/release-source.yml).
All workspace packages remain private; there is no npm publication, native
binary, Homebrew formula, or deployment. The workflow attaches frozen-commit
source tar/zip archives, release notes, an inventory, and checksums.

## Prepare

From current `main`, move the intended `Unreleased` entries into exactly one
`## X.Y.Z - YYYY-MM-DD` section using the maintainer's local date. Preserve
contributor credits and lead with a one-sentence `**Highlights:**` paragraph.
Set the root and four `sdk/*/package.json` versions to that release version.
Keep the SDK shim at `0.0.0-cookbook-shim`; it is not the public SDK release.

Run the same credential-free checks as the release build:

```sh
node scripts/verify-release.mjs
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` builds and smoke-tests the compiled starter CLIs as well as running
formatting, lint, type, unit, documentation, and example checks. The workflow
installs the pinned pnpm 10.34.5 before these checks.

For browser verification, serve the Agent Workbench and Run Board builds with
their `preview` scripts and check that HTML and referenced assets load. They use
the workspace SDK shim; that check does not prove a live Gateway connection.

## Publish through Actions

After the preparation PR and push CI pass on the exact merged commit, create a
signed annotated `vX.Y.Z` tag using the release SSH key authorized by
`.github/release-allowed-signers`, verify it, and push only that tag. Never move
an existing tag or reuse a published version. The tag starts `Release`; do not
publish locally or create a GitHub Release by hand.

The shared workflow freezes the commit, checks protected-main ancestry, the SSH
signature, version metadata, dated changelog notes, and green independent push
CI. It then runs the checks below and binds the payload to two independent
verifiers before publication. A live dispatch also requires an existing signed
tag; it cannot silently substitute an unsigned tag.

## No-publish rehearsal

Dispatch `Release` on the current protected `main` with the version matching its
metadata and a dated changelog section. `dry_run` defaults to `true`:

```sh
gh workflow run release.yml --repo openclaw/cookbook --ref main -f version=0.1.0 -F dry_run=true
```

This checks current main even when that version has an older tag. It neither
creates nor changes tags, GitHub Releases, registry versions, or deployments.
Only the release pipeline's checks run; ordinary push workflows remain separate.

## Verify and close out

Confirm the Actions run succeeded and the GitHub Release has the expected
signed tag, frozen commit, exact dated changelog section, inventory, and
`SHA256SUMS`. Download the attached payload and verify its checksums. Never
replace an existing release's assets to fix a failed attempt.

Keep the released changelog section intact. Open an empty `## Unreleased`
section if one is absent, review and merge the follow-up, and leave `main` clean
and current. No release is complete while its independent CI or publication
verification is failing.
