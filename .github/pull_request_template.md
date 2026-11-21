<!--
Write for someone using or copying a cookbook recipe or SDK example who has not
read the code. The title and opening problem statement should make sense without
the diff or a linked issue. Add a visible Related: or Closes line when useful.

Lead the title with the affected task and outcome, not implementation details:
Good: fix: let terminal users cancel a run while it starts
Bad: fix(cli): track pending cancellation before handle assignment
Good: docs: show how to test an app without a Gateway
Bad: docs: document the custom transport interface

For internal-only work, name the actual contributor or maintainer workflow affected.
-->

## What Problem This Solves

<!--
Describe the concrete user, product, or operational problem.
In 1–3 plain sentences, say who is affected, what happens today, and why it
matters to them. For a bug, name the trigger if known. For a feature or internal
work, describe the need in the actual workflow without inventing harm.
Could a reader understand the problem without knowing your proposed fix?

Good: "Background checks can use up a new user's model allowance before they've
asked the assistant to monitor anything."
Bad: "Turn off periodic checks on fresh installs."
-->

## User Impact

<!--
Lead with what recipe users, app developers, or maintainers can now do or expect,
usually in one sentence. For internal-only changes, say there is no user-visible
change; do not invent a benefit. Keep important risks, breaking changes, migration
steps, and required user actions visible here.
-->

## Why This Change Was Made

<!--
Briefly explain how the change addresses the problem without repeating the impact.
Keep file lists, internal acronyms, and long technical walkthroughs in the diff or
optional <details>. Include technical detail when it explains behavior or a
material tradeoff; do not hide risks or required actions in <details>.
-->

## Evidence

<!--
Start with the behavior checked and the result in plain language, then link useful
tests, CI results, terminal output, screenshots, or other proof. For example, say
whether an app test completed with an in-memory transport without a live Gateway,
rather than only listing a test command. Distinguish local SDK-shim validation from
live Gateway behavior; neither proves the other. Keep meaningful gaps visible.

Follow CONTRIBUTING.md for the existing checks, including pnpm check. Put exact
commands, commit hashes, and long output in links or optional <details> after the
result summary. Redact credentials and private session data from shared evidence.
-->
