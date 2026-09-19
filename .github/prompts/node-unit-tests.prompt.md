---
name: node-unit-tests
description: "Generate or update a Jest test file for a Node.js module (unit tests, or HTTP API tests for routes). Use when the user wants tests for an open file, a selection, or a src/ path."
agent: Unit Tester
argument-hint: "optional src path, e.g. src/routes/application.js"
---

Slash command for the **Unit Tester** agent on one Node.js `src/` module.

## Resolve the target

Use the first that is a source module:

1. A `src/**/*.js` path in this message
2. The current selection
3. The currently open file

If none of those is source under `src/`, ask which file to test. Do not guess.

Map `src/<path>/<file>.js` → `tests/<path>/<file>.test.js` (create missing directories). If the source is under `src/routes/`, follow the **HTTP API tests** section of the installed Node.js unit-test instructions; otherwise follow **Unit tests**. Path layout, runner, and execution are owned by those instructions — follow them; do not restate or override them.

## Run

Hand the resolved source and mapped test path to Unit Tester. Verify with the **narrowest** project test command, executed per the installed Node.js unit-test instructions.
