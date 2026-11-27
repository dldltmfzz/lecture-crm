# PIXEL AI OFFICE — Phase 0 Readiness & Existing-System Assessment

**Assessment date:** 2026-11-27  
**Repository:** `dldltmfzz/lecture-crm`  
**Assessment branch:** `pixel-ai-office/phase0-readiness`  
**Purpose:** Establish a safe, evidence-based starting point for PIXEL AI OFFICE without replacing the existing AILeaders OS.

## 1. Executive decision

**Do not create a second application or a new production database yet.** The existing AILeaders OS repository already contains a Next.js monorepo and working business-domain modules. PIXEL AI OFFICE should be developed as an incremental extension after the existing deployment and database state are verified and stabilized.

## 2. GitHub repository facts verified on 2026-11-27

- Repository: `dldltmfzz/lecture-crm`
- Repository default branch: `main`
- Only branch returned by GitHub at assessment time: `main`
- The historical `aileaders-os-staging` branch recorded in the 2026-09-07 handover was not present.
- Latest commit on `main`: `d02c749a58e9add908bc98aa496cf02d6c16ac72`
- Latest commit date: 2026-11-24
- Latest commit message: `chore: verify Cloudflare automatic deployment`
- Parent commit: `cb743c2816e3348f344ffb855349b1b176708a5b`
- Parent commit message: `feat: migrate AILeaders OS to Cloudflare`
- The migration commit describes replacing the legacy Vite/Vercel deployment setup with a Next.js and OpenNext Cloudflare Workers application.
- GitHub combined status for latest commit returned a **Vercel failure** check. This is not proof that Cloudflare deployment failed or succeeded; Cloudflare runtime status still requires independent verification.

A non-production working branch was created for preparation:
`pixel-ai-office/phase0-readiness`

No production branch, production deployment, or database was modified by this assessment.

## 3. Current repository structure verified

The repository is a pnpm/Turborepo monorepo. Root scripts include dev, local, verify:local, build, lint, typecheck, test and format.

Verified technology/configuration:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth / SSR client libraries
- Supabase PostgreSQL integration in application code
- OpenNext Cloudflare adapter
- Wrangler 4
- Cloudflare Worker configuration in `apps/web/wrangler.jsonc`
- Package manager: pnpm 10.15.0

Existing business features found in the repository:
- Customers / CRM
- Programs / courses
- Finance UI
- Students
- Instructor directory and instructor portal
- Availability and free-class board
- Excel import and duplicate review
- Auth, user administration, permissions
- Local run and local verification scripts

Important: the latest Git tree contained 187 paths and did not expose a `supabase/` directory or committed migration folder. This does not prove that the remote Supabase database has no migrations; it means the current repository snapshot does not provide the expected migration source tree. Locate and restore/organize the canonical migration history before making schema changes.

## 4. Supabase state verified

Project reference: `lxkorsxhkaigppxdomhx`  
Region: `ap-northeast-2` (Seoul)

The connected Supabase project listing and project detail both returned status **INACTIVE** on 2026-11-27.

Consequences:
- Do not run database queries, apply migrations, deploy Edge Functions, or treat the database as available until the project is restored and health is confirmed.
- Do not create a replacement project just to bypass the inactive state.
- Restoring the project may have billing implications; confirm the account's current plan/cost before restoration.
- Before restoration or schema changes, establish backup/restore point and identify the authoritative schema/migration history.

## 5. Immediate blockers

| Priority | Blocker | Evidence | Required action |
|---|---|---|---|
| P0 | Supabase project inactive | Supabase project status INACTIVE | Confirm restore/cost and restore safely; then inspect migrations, tables, RLS, advisors |
| P0 | Deployment state not fully verified | Latest GitHub commit has Vercel failure status; migration commit says Cloudflare | Verify Cloudflare Worker deployment and runtime directly; distinguish Vercel legacy check from Cloudflare deployment |
| P0 | Old staging branch absent | GitHub lists only main | Use the new preparation branch for changes; agree on long-term staging/PR policy |
| P1 | Migration source missing from current tree | No supabase/ path in latest repository tree | Recover canonical migrations 001–006 or export/construct a reviewed baseline from the actual DB after restore |
| P1 | No PIXEL AI task/agent orchestration module found in current tree | Current modules are CRM/programs/finance/instructors/import/auth | Design and implement task orchestration as an additive module |
| P1 | Master policy source incomplete | Full 100 rules and STEP 2-1~144 originals unavailable in current handover | Recover source documents before encoding every rule |
| P1 | 27-person org allocation unresolved | Historical 20-person structure conflicts with 27 target | Use placeholder/test agents only until representative confirms final roster |

## 6. Safe development sequence

### Phase 0A — Stabilize and verify existing OS
1. Clone/open the exact repository and inspect local working tree.
2. Confirm latest commit and compare it with the GitHub main head.
3. Run install, typecheck, tests, lint and build locally without changing production data.
4. Verify Cloudflare Worker deployment, environment bindings, logs and runtime health.
5. Restore Supabase only after cost/plan confirmation; then verify project health.
6. Inspect schema, migration history, RLS, RPCs, Edge Functions, Storage and security/performance advisors.
7. Recover the canonical migration files and establish a backup/rollback point.

### Phase 0B — Requirements baseline
1. Add the consolidated policy and requirements registry.
2. Preserve the confirmed STEP 2-145~254 decisions.
3. Recover the full STEP 2-1~144 source and all 100 operating rules.
4. Create a decisions-required register for unresolved items.
5. Map each requirement to an existing module, a new module, a test and an owner.

### Phase 1 — First working AI workflow
Build one vertical slice only:
**Representative task instruction → 60-minute AI introductory lecture outline draft → independent reviewer AI → up to three revision rounds → representative review/approval → audit trail.**

Use test-only agent identities and synthetic content. Do not assign the final 27-person roster yet.

### Phase 2 — Generalize the engine
After the first workflow passes end-to-end tests, extract reusable:
- task orchestration
- agent registry
- permission checks
- approval workflow
- reviewer service
- audit logging
- retry/recovery
- notification service

### Phase 3 — Extend association business modules
Only after the core workflow is stable, extend courses, CRM, member operations, finance, content operations and external integrations.

## 7. Non-negotiable safety rules

- Never overwrite or delete the legacy CRM schema or payment ledger.
- Never modify or delete payment/refund ledger history to correct balances; use compensating transactions and existing validated RPCs.
- Never merge customers solely by phone number when names conflict; route to human review.
- Preserve original Excel values and legacy notes.
- Never place service-role keys, API secrets, passwords or tokens in source code, client bundles, prompts or Git.
- Enforce permissions server-side and in RLS; hiding UI controls is not security.
- All outbound messages, public SNS posts, payments, refunds, transfers, pricing, contracts and policy changes require the representative's approval.
- Do not auto-deploy to production from the preparation branch.
- Do not claim AI execution or deployment success unless the live integration confirms it.
- All test workflows must use synthetic data until explicitly approved for production data.

## 8. Required evidence before Phase 1 coding

- [ ] Local clone matches expected GitHub commit.
- [ ] Existing application can install and run locally.
- [ ] Typecheck, tests, lint and build results recorded.
- [ ] Cloudflare Worker deployment and runtime verified.
- [ ] Supabase project restored and healthy (if approved).
- [ ] Canonical migrations 001–006 recovered and reconciled.
- [ ] Backup/rollback plan documented.
- [ ] Existing RLS and critical RPCs reviewed.
- [ ] First workflow data model reviewed without applying migrations.
- [ ] Test-only AI agent and reviewer roles defined.
- [ ] Representative confirms unresolved decisions that block implementation.

## 9. Assessment conclusion

The project is closer to production than a greenfield build because a substantial AILeaders OS already exists. The next correct move is **not** to build the 27-agent office UI first. It is to stabilize the existing app, restore/verify the data layer, and then add the first real AI task workflow as an isolated, testable module.
