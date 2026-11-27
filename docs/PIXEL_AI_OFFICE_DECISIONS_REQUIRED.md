# PIXEL AI OFFICE — Decisions Required Register

**Updated:** 2026-11-27  
**Rule:** Codex must not silently decide these items. Record evidence and request representative confirmation when the choice affects cost, security, production data, organization structure or external actions.

| ID | Decision needed | Why it blocks production | Current status |
|---|---|---|---|
| DR-001 | Restore existing Supabase project and confirm any billing impact | Project `lxkorsxhkaigppxdomhx` is INACTIVE | Await representative confirmation |
| DR-002 | Confirm Cloudflare Worker deployment and production URL/runtime | Latest GitHub commit carries a Vercel failure status while code migration targets Cloudflare | Needs live verification |
| DR-003 | Confirm canonical Git branch and PR strategy | Historical staging branch is absent; only main was listed | Preparation branch created; policy pending |
| DR-004 | Recover canonical Supabase migration files 001–006 | Current Git tree has no supabase migration directory | Needs source recovery |
| DR-005 | Recover all 100 operating rules and STEP 2-1~144 original decisions | Current handover contains summaries only | Source documents needed |
| DR-006 | Confirm final 27-agent roster and per-team allocation | Historical 20-person composition conflicts with 27-agent target | Use test-only placeholders |
| DR-007 | Confirm AI API/provider budget and per-agent quotas | Needed for concurrency, retry, and monthly cost controls | Not set |
| DR-008 | Confirm production backup and recovery objectives | RTO/RPO targets need infra validation and cost agreement | Policy target exists; implementation unverified |
| DR-009 | Confirm external connector accounts/scopes (Google, Kakao, SMS, Zoom, e-sign) | Integration requires OAuth/API access and consent | Not verified |
| DR-010 | Confirm STEP 2-255 employee termination/retirement policy | Last asked question not answered | Unresolved |
| DR-011 | Confirm whether the first lecture-draft workflow uses OpenAI API directly and which model | Needed for actual AI generation and cost estimate | Provider chosen generally; model/limits pending |
| DR-012 | Confirm whether task/agent audit logs need immutable external retention | Full audit requirement needs retention and storage decision | Design required |

## Current technical facts (do not overwrite with guesses)
- GitHub repository: `dldltmfzz/lecture-crm`
- Default branch at assessment: `main`
- Preparation branch: `pixel-ai-office/phase0-readiness`
- Latest main commit at assessment: `d02c749a58e9add908bc98aa496cf02d6c16ac72`
- Existing app: Next.js 16 / React 19 / TypeScript / Tailwind 4 / Supabase SSR
- Hosting migration in latest history: OpenNext Cloudflare Workers
- Supabase ref: `lxkorsxhkaigppxdomhx`, region Seoul, status INACTIVE
- Do not treat the 2026-09-07 Vercel deployment notes as current without checking live status.
