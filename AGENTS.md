# Agent Rules & Triage System

## TASK TRIAGE (Evaluate at the start of EVERY task)
- **LEVEL S** (typo, text, color, spacing, a value, a one-line fix in one file):
  Read no docs. Locate code by search, edit directly. Typecheck only if types are affected. No browser test. No memory update (except 1 line in `docs/LESSONS.md` if a pitfall was found). Reply in 1-2 lines. Never delegate.
- **LEVEL M** (bug fix, new control/setting, 2-4 files, tweak one mode, visual effect):
  Read `docs/STATE.md` + matching `[area]` lines of `docs/LESSONS.md` + relevant mode docs. Check `LESSONS.md` decisions before reasoning. Plan in 3-5 lines, implement with targeted edits, run typecheck/build once, quick browser check of changed feature only. Update `STATE.md`, add 1 `LESSONS.md` line if non-trivial bug fixed. Delegate to specialist if useful. Reply max 5 lines.
- **LEVEL L** (new mode, new module, refactor, architectural change, whole phase):
  Read `STATE.md`, `PROJECT.md`, relevant `LESSONS` and mode docs. Write a plan (max 15 lines) and wait for approval if changing architecture or adding dependencies. Delegate implementation to specialists, then call `qa-reviewer` once. Verify in browser at phase end. Update `STATE.md`, `PROJECT.md`, mode docs, `LESSONS.md`. Compress memory files over limits. Reply max 8 lines, then stop and wait.

## GENERAL RULES
- Never scan the whole codebase. Search first, open only needed files and line ranges.
- Targeted edits only, never rewrite a whole file for a small change.
- No refactor, rename or "improvement" not requested. Reuse existing code.
- Think deeply on physics, collisions, performance and tricky bugs; stay concise elsewhere.
- Do not narrate. Do not paste large code in chat. Group related edits in one pass.
- Before marking task done: run typecheck/build and fix errors.
- Browser testing only at the end of a phase for the changed feature.
- Keep memory files under line limits: merge duplicates, delete obsolete lines.
- Commit after each validated phase with a clear message; never push without approval.

## DELEGATION
- Max 2 subagents running at once. Never spawn extra subagents autonomously.
- Give subagents a SHORT brief (goal, files, constraints). They start with no context, so they must read `docs/` themselves.
- After each Level L task, call `qa-reviewer` once, then fix reported issues.
- Only the main agent edits `docs/STATE.md` and `docs/PROJECT.md`, after collecting reports.
