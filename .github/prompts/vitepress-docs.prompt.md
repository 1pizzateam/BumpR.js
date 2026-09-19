---
name: vitepress-docs
description: "Scaffold or update a VitePress product docs site in a user-named folder. Use when the user wants a documentation website."
agent: VitePress Docs
argument-hint: "docs root, e.g. website"
---

Slash command for the **VitePress Docs** agent.

## Resolve the docs root

The first positional argument is the documentation website root.

If this message has no argument and no explicit folder path, ask which folder to use. Do not guess one.

## Run

Hand that resolved path to VitePress Docs as the docs root. Site rules are owned by the installed VitePress docs instruction — do not restate or override them.
