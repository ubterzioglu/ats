# Overnight Log — 4 October 2026, updated 5 October 2026

## Summary

All surface debt resolved. 76 of 76 batches landed, all reachable from a screen. Supabase migration
applied. Ghost-check 404 fixed.

## What landed (4 October)

8 commits:

1. `cc856d0` — Surface debt resolved (F.2, F.3, D.6, G.3, G.4, F.4, F.5)
2. `d7a85ef` — F.6 ghost posting check (first server route)
3. `68a0f53` — Acceptance tests (surface-debt + d4-d5-surface)
4. `f624976` — Reachability guardian test
5. `3be89c2` — F.6 security review document
6. `a8832d5` — Removed normalizeIsoDates (redundant)
7. `ac3736f` — MASTERPLAN updated (76/76 batches, all reachable)
8. `b5668c9` — Handover document
9. `20dbbf1` — agent-prompts updated (only browser verification remains)

## What landed (5 October)

4 commits:

10. `046c40a` — Overnight log (initial, pre-push)
11. `1ce3859` — Supabase migration 0002: revoke PUBLIC execute on purge function
12. `acfb051` — Document SUPABASE_SERVICE_ROLE_KEY in .env.example
13. `8000f5b` — Fix middleware matcher to exclude /api/ (ghost-check 404 fix) + test

## Gate status

```
npm run lint        clean
npm run typecheck   clean
npm test            820 tests across 84 files — all pass
npm run build       clean
```

## What remains

1. **D.4 and D.5 browser verification** — owner accepted criteria 2026-10-05, explorative test with user
2. **V.10 and A.4 browser verification** — with user

## Completed (5 October)

- **Supabase migration:** `0001` + `0002` applied. RLS verified: anon cannot read table or call purge.
- **Ghost-check 404:** Fixed in `8000f5b`. Live site now returns 200 for valid requests.
- **Deploy:** Pushed to origin/main 2026-10-05. Coolify redeploy completed.

## Correction

The original overnight log stated "all commits pushed to origin/main" at `20dbbf1`, but HEAD was
actually 11 commits ahead. The full push happened on 2026-10-05.

## Working tree

Clean. Only `.omc/project-memory.json` modified (harness state).

## HEAD

`8000f5b` — all commits pushed to origin/main.
