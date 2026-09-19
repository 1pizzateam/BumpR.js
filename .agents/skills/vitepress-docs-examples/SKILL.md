---
name: vitepress-docs-examples
description: 'Scaffold or match a VitePress product docs site (package.json, config.mjs, home/guide pages, mermaid, dev dockerfile, Pages workflow). Use when adding or updating documentation under a user-supplied docs root.'
license: MIT
---

# VitePress Docs Examples

On-demand templates for the VitePress docs instruction. Normative rules stay in the installed `vitepress-docs` instruction; this skill owns scaffolding templates only.

## When to Use This Skill

- Creating a docs site from scratch.
- Adding a guide page, sidebar group, Compose docs service, or GitHub Pages workflow in that pattern.

## Path resolution

Resolve `references/` relative to **this skill's install directory** (the folder that contains this `SKILL.md`).

Templates write `<docs-root>` wherever the site root appears. Substitute the resolved root before copying.

## Workflow

1. Follow the installed VitePress docs instruction for layout, stack, and sidebar rules.
2. **Read `references/examples.md` now** before scaffolding.
3. Copy templates into the docs root.

## Done When

- Copied files match these templates, with `<docs-root>` substituted everywhere.
