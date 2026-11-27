# Codex Phase 0 Execution Prompt — After Supabase Recovery

You are working in the existing repository `dldltmfzz/lecture-crm`.

**Use branch:** `pixel-ai-office/phase0-readiness`  
**Do not push changes to `main` or deploy production.**

Read these documents first:
- `docs/PIXEL_AI_OFFICE_PHASE0_READINESS.md`
- `docs/PIXEL_AI_OFFICE_DECISIONS_REQUIRED.md`
- `docs/PIXEL_AI_OFFICE_FIRST_WORKFLOW.md`
- `docs/PIXEL_AI_OFFICE_SUPABASE_RECOVERY_INSPECTION.md`

## Context confirmed on 2026-11-28
- Existing application is a pnpm/Turborepo monorepo with Next.js 16, React 19, TypeScript, Tailwind 4, Supabase SSR and OpenNext Cloudflare Workers.
- Existing modules include CRM, programs, finance, students, instructors, Excel import, auth and permissions.
- GitHub default branch is `main`; the historical `aileaders-os-staging` branch is absent.
- Current Supabase project `lxkorsxhkaigppxdomhx` is ACTIVE_HEALTHY after restore.
- Remote DB has 17 public tables and 10 legacy_crm tables; all listed tables have RLS enabled.
- Remote migration ledger has 23 entries. The GitHub tree currently does not contain the canonical `supabase/migrations` source directory.
- Exact counts: public.profiles=1; legacy_crm.users=1; legacy_crm.courses=2; legacy_crm.options=34; other inspected tables=0.
- Supabase advisor reports 32 authenticated-executable SECURITY DEFINER functions, 1 extension-in-public warning, leaked password protection disabled, plus performance findings. Do not mass-revoke function permissions or change RLS blindly.
- No backup/PITR artifact was verified in the dashboard.
- Cloudflare runtime status is not yet verified.
- No DB schema/data changes were made during the recovery inspection.

## Phase 0 tasks — perform in order

### A. Local repository safety and health
1. Confirm current branch and working tree. If not on `pixel-ai-office/phase0-readiness`, switch safely without discarding local changes.
2. Confirm HEAD and compare with GitHub main commit.
3. Inspect package scripts, app config, environment variable names (never print secret values), and existing feature architecture.
4. Install dependencies only if needed and report any lockfile changes.
5. Run:
   - `pnpm --filter @aileaders/web typecheck`
   - `pnpm --filter @aileaders/web test`
   - `pnpm --filter @aileaders/web lint`
   - `pnpm --filter @aileaders/web build`
   Use the repository's actual scripts if they differ. Do not change dependencies just to hide failures.
6. Do not run real customer, payment, refund, attendance, instructor assignment, or import mutations during tests. Use mocks or synthetic test data.

### B. Deployment verification
1. Inspect `apps/web/wrangler.jsonc`, OpenNext config and deploy scripts.
2. Determine how the project is deployed to Cloudflare Workers.
3. Verify the deployed Worker and its runtime using authorized project tooling or report the exact manual dashboard steps if unavailable.
4. Do not deploy or change production environment variables.
5. Distinguish old Vercel status checks from current Cloudflare deployment health.

### C. Database source reconciliation — read only
1. Compare remote migration ledger with local migration files, Git history and any available archived source.
2. Do not fabricate replacement migration SQL from table names.
3. Do not apply any migration.
4. Inspect RLS policy definitions, SECURITY DEFINER function bodies, function grants and role checks. Summarize the 32 advisor findings by risk and whether each RPC is intentionally exposed.
5. Do not change grants, policies, extensions, indexes, Auth settings or data.
6. Identify how to verify backup/PITR in Supabase Dashboard. Do not claim a backup exists without evidence.

### D. First AI workflow implementation plan
After A–C, create an implementation plan for the first vertical slice:
Representative instruction → 60-minute AI introductory lecture draft → independent reviewer → max 3 revision rounds → representative approval/request changes/hold → audit trail.

Before coding, identify reusable abstractions and missing pieces. Do not create duplicate auth, duplicate database or a second app.
If the local tests pass and the database source/backup questions are resolved, implement the workflow only on the preparation branch with synthetic data. If a prerequisite is missing, stop at a detailed plan and report the blocker.

## Mandatory safety
- No production deployment.
- No database migrations or DDL.
- No real customer/learner data mutations.
- No payments/refunds/transfers.
- No outbound email/Kakao/SMS/SNS actions.
- No API secrets in source, prompts, logs or commits.
- Do not create 27 named employees. Use clearly labeled test-only placeholder agents.
- Do not mark mock AI output as a real provider execution.
- Keep all changes additive and reversible.

## Final report format
1. Current branch and HEAD
2. Local test results
3. Cloudflare runtime verification result
4. Supabase migration reconciliation
5. Backup/PITR verification status
6. Security review summary
7. Files changed
8. Tests run
9. Blockers requiring representative decision
10. Recommended next action
