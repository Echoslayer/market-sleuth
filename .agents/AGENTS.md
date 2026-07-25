# AGENTS.md (Antigravity)

Project instructions are canonical in [../CLAUDE.md](../CLAUDE.md). Read it
first — architecture, commands, the scenario-JSON contract, and the licensing
constraint on real data all live there. Do not duplicate rules here.

## Antigravity-specific routing

- `.agents/skills` → `../.claude/skills` (shared with Claude and Codex).
- Specs and tickets: `.scratch/<feature>/` (`spec.md` + `issues/`), executed in
  order, marked done in commits.
- Review, architecture and miss-capture write-ups go to the private
  `market-sleuth-private` repo, never here.
