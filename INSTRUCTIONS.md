# Email Capture Plugin Instructions

Read this before changing the `email-capture` Obsidian plugin.

## Project locations

- Source repo: `/Users/franklingarrett/Codex/plugins/email-capture/`
- Vault project docs: `/Users/franklingarrett/FJG Vault/Artifacts/Email Capture App/`
- GitHub repo: `https://github.com/jajuangarrett-ctrl/email-capture`
- Desktop installed build output, if present: `/Users/franklingarrett/FJG Vault/.obsidian/plugins/email-capture/`

Treat `.obsidian/plugins/email-capture/` as installed build output, not source.

## Working rules

- Read this file before making plugin changes.
- Read the vault docs at `Artifacts/Email Capture App/PLUGIN.md` and `SPEC.md` when behavior or history is unclear.
- Keep the plugin simple. The stable flow is: capture text, send it to GPT-4o, save the returned draft, and save raw text only if drafting errors.
- Do not add refusal detectors, generic-template detectors, fallback draft builders, or extra drafting modes unless Franklin explicitly asks.
- Preserve Franklin's email style: use "Hello" rather than "Hi"; avoid opening pleasantries like "I hope you are doing well"; avoid closing pleasantries; keep the tone professional, direct, natural, and collegial.
- Preserve the output format: subject line with no `Subject:` label, body under 200 words, and `Best regards,` followed by `Franklin`.

## Release loop

1. Edit source in this repo.
2. Build `main.js` with `node esbuild.config.mjs production`.
3. Bump `manifest.json`, `package.json`, `package-lock.json`, and `versions.json`.
4. Commit, tag, push, and create a GitHub release with `main.js`, `manifest.json`, and `styles.css`.
5. Update vault docs in `Artifacts/Email Capture App/PLUGIN.md` and `PLAN.md` when behavior changes.
6. Refresh BRAT on iPhone to install the new release.
