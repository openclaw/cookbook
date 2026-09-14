# Releasing the Cookbook

Cookbook releases are source snapshots: an SSH-signed Git tag and a GitHub
Release. All workspace packages are private. Do not publish them to npm or
attach build artifacts. GitHub supplies the source archives automatically.

This follows the frozen-source, verified-tag, exact-changelog publication
conventions in [OpenClaw release workflows](https://github.com/openclaw/release-workflows).
The cookbook uses the manual process below because the shared binary release
workflows do not apply to this source-only repository.

## Prepare

Start from a clean, current `main`. Finalize every entry in `## Unreleased` under
`## X.Y.Z - YYYY-MM-DD`, using the maintainer's local date. Keep contributor
credits and put a one-sentence `**Highlights:**` line first. Order features and
user-visible fixes before compatibility notes, then tooling and documentation.

Set the root and four starter `package.json` versions to the release version.
Keep `packages/openclaw-sdk-shim/package.json` at `0.0.0-cookbook-shim`: it is
a local validation aid, not a release of the public SDK.

Run the full gate:

```bash
pnpm install --frozen-lockfile
pnpm check
```

This covers formatting, type checking, lint, tests, documentation checks, all
starter builds, and compiled CLI smoke tests. Review the release diff, open a
PR, and squash-merge it only after its checks pass. Wait for the `Check` and
CodeQL runs on the resulting exact `main` commit to succeed before tagging.

## Verify the web starters

There is no hosted documentation site or deployment workflow. Both web starters
build as part of `pnpm check`. From the release commit, serve each build and
verify that its HTML and referenced JavaScript/CSS assets return HTTP 200:

```bash
pnpm --filter @openclaw/cookbook-agent-workbench preview --host 127.0.0.1 --port 4173 --strictPort
pnpm --filter @openclaw/cookbook-run-board preview --host 127.0.0.1 --port 4174 --strictPort
```

Run the preview commands in separate terminals and stop them after verification.
These demos use the workspace SDK shim; serving them does not validate a live
Gateway connection.

## Tag and publish

Pull the merged release commit and record its SHA. Immediately before tagging,
check both local/remote tags and GitHub Releases; stop if the version already
exists. Never move or replace a release tag.

```bash
git switch main
git pull --ff-only
git status -sb
git fetch origin --tags
git tag --list
gh release list --repo openclaw/cookbook --limit 3 --json tagName
git rev-parse HEAD
```

Use the designated release SSH signing key through the maintainer's credential
workflow. `.github/release-allowed-signers` records the authorized public key.
The private key is supplied only to the signing command, never committed.

With `version`, `release_commit`, and `signing_key` set to the verified release
version, exact CI-green SHA, and temporary signing-key path:

```bash
git -c gpg.format=ssh -c user.signingkey="$signing_key" tag -s "v$version" "$release_commit" -m "Release $version"
git -c gpg.format=ssh -c gpg.ssh.allowedSignersFile=.github/release-allowed-signers verify-tag "v$version"
git push origin "refs/tags/v$version"
```

Copy only the dated changelog section's contents to a temporary notes file,
starting with Highlights and excluding the version heading. Preserve every
entry and credit exactly. Publish without generated notes or extra assets:

```bash
gh release create "v$version" --repo openclaw/cookbook --verify-tag --title "v$version" --notes-file "$notes_file" --latest
```

Use the authenticated GitHub CLI appropriate to the maintainer's environment.
There is no tag-triggered release workflow; publication is this explicit command.

## Verify and close out

Read the GitHub Release through the REST API and verify its tag, published
state, exact changelog body, and empty asset list. Resolve the remote annotated
tag to the recorded release commit and verify its signature. Record the
successful CI run URLs and web-starter HTTP checks.

Open one empty `## Unreleased` section above the released section, leaving the
published section intact. Keep package versions at the released version until
preparing the next release. Review and squash-merge this follow-up PR, then
leave the local checkout clean on `main` at `origin/main`. Remove task branches
and generated `dist` directories.
