---
source: jensethan
human: @bodal
human_date: Aug 2 10:57:38
---

# Introduction

You are an agentic developer and are in the root /Users/jensbodal/github folder where there are various agentic and non-agentic packages.

Right now we are mainly working in /Users/jensbodal/github/bodal.dev but also have access to /Users/jensbodal/github/vibe-cli and
also have /Users/jensbodal/github/shell-settings

I am not quite sure the state those packages are in but they cover concepts we want to apply to bodal.dev, so please review those packages
and their structure and incorporate that into the prompt below for how to set up a local package to deploy a SSG site with nextjs
deployed to github pages with github actions.

## Instructions

Review the instructions that you are given and review the prompt, and then _think through_ and systematically create a todo list
as you do so so that we can then go back and review the development plan before starting.


## Prompt

Great—Next.js can definitely do fully static sites via output: 'export'. Let’s tailor your repo-aware agent prompt for that.

Copy-paste agent/system prompt (Next.js SSG + GitHub Pages)

> Role: Repo-aware coding agent

> Repo: https://github.com/jensbodal/bodal.dev (local: /Users/jensbodal/github/bodal.dev)

> Goal: Implement a static Next.js site and GitHub Pages deploy, strictly following the conventions found in ./vibe-cli and ./shell-settings.

Objectives
1. Use Next.js (App Router) with static export (next.config.{js,ts} → output: 'export').
2. Sections: Home, About, Projects, Blog (MD/MDX), Contact.
3. Content in content/ with frontmatter; support MDX if low-friction.
4. Clean, accessible, fast theme; dark/light toggle; minimal client JS.
5. Deploy via GitHub Pages with custom domain bodal.dev.

Hard constraints (read before changes)
- Read and summarize expectations from ./vibe-cli/** and ./shell-settings/**:
  - Note command wrappers, package manager choice, aliases, environment setup, formatting/linting, commit style, and any guardrails.
- Use the repo’s preferred package manager and existing lint/format commands.
- Idempotent commands only; confirm before any destructive changes.
- Small, reviewable commits with clear messages.

Deliverables
- Next.js App Router scaffold configured for static export.
- next.config.ts with output: 'export' and images.unoptimized = true (static images), and any needed options called out from discovery.
- MD/MDX blog pipeline (sample posts with frontmatter).
- Scripts wired to your existing vibe-cli / shell aliases.
- public/CNAME set to bodal.dev (so it’s included in the export).
- .github/workflows/pages.yml that builds + exports to out/ and deploys to GitHub Pages.
- README.md and CONTRIBUTING.md explaining local dev, build, deploy, content model, and how to work with the agentic workflow.

Process the agent should follow
1. Discovery pass
   - List top-level files; read ./vibe-cli/** and ./shell-settings/**.
   - Output a bullet summary of: package manager, run/lint/format/test commands, commit conventions, and any required environment steps.
   - Detect existing Next.js setup; if present, plan a minimal-diff migration to output: 'export'.
2. Plan & confirm
   - Propose site structure (routes, content model, theme) in ~10 bullets. Wait for confirmation.
3. Scaffold & configure
   - Initialize/adjust Next.js with the discovered package manager and your shell aliases.
   - Add app/ routes, content/, MDX support (only if compatible with constraints found).
   - Configure next.config.ts:

```
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false
};
export default nextConfig;
```
1.
   -
   - Ensure assets in public/ copy to out/ on export (including CNAME).
2. Styling & a11y
   - Add base typography, spacing scale, and color tokens; verify contrast.
   - Implement light/dark (prefers-color-scheme) with a small toggle.
3. Build & preview
   - Run local commands as defined by vibe-cli/shell-settings.
   - Show next build && next export -o out output summary.
4. Deploy (GitHub Pages)
   - Add workflow at .github/workflows/pages.yml similar to:

```
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 'lts/*' }
      - run: corepack enable
      # Use the package manager discovered from vibe-cli/shell-settings:
      # e.g., pnpm i --frozen-lockfile
      - run: <install_command>
      - run: <build_command>  # typically: next build && next export -o out
      - uses: actions/upload-pages-artifact@v3
        with: { path: out }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```
1.
   -
   - Ensure public/CNAME = bodal.dev exists so Pages sets the custom domain automatically.
2. Docs & checks
   - Update README.md with: prerequisites, local dev, build/export, deploy, content authoring, and how vibe-cliintegrates.
   - Add CONTRIBUTING.md explaining commit style, scripts, and agent workflow.
   - Run lint/format/tests per your conventions and surface results.

Guardrails
- If vibe-cli conventions conflict with Next.js export or GitHub Pages, propose options and wait for approval.
- Keep dependencies lean; prefer config and CSS utilities over heavy UI kits.

Output format
- Phase summaries with file trees and diffs.
- Exact commands executed (respecting your aliases).
- Code blocks for key files (next.config.ts, workflow YAML, example MDX post, public/CNAME).
- Final checklist + next steps.

One-liner kickoff

> “Using the system prompt above, implement Next.js static export for bodal.dev, honoring ./vibe-cli and ./shell-settings. Start by summarizing those folders, then propose the site plan before scaffolding.”

---

Your turn (one quick thing): Which package manager do you want the agent to use—pnpm, npm, or yarn?
