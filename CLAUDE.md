# CLAUDE.md

@AGENTS.md

## Claude Code specifics

- Use plan mode for any task that `AI/core/workflow.md` §2 classes as Medium or Large.
- Subagents start with none of this conversation. Tell each one which `AI/` files to read and which files it may touch.
- Use the Bash output of `npm run validate` as evidence in your report; don't paraphrase it as "passing" without running it.
