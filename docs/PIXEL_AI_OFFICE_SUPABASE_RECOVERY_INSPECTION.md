# Supabase Recovery & Read-only Inspection Report

**Date:** 2026-11-28  
**Project:** `lxkorsxhkaigppxdomhx`  
**Region:** `ap-northeast-2` (Seoul)  
**Branch:** `pixel-ai-office/phase0-readiness`

## 1. Recovery result

- Supabase organization plan: Free.
- Project restore action returned success.
- Project status subsequently changed to `ACTIVE_HEALTHY`.
- No paid plan upgrade or new Supabase project was created.
- No database schema or application data was changed during this inspection.

## 2. Database inventory

- `public`: 17 tables.
- `legacy_crm`: 10 tables.
- RLS enabled on all 27 listed tables.
- RLS policies: 31 in `public`, 36 in `legacy_crm`.
- Applied migration history: 23 entries, from `20260904055656 foundation` through `20260907004714 import_storage_rls`.
- Supabase Edge Functions: none listed.

### Exact row counts from read-only COUNT(*) queries

| Schema | Table | Rows |
|---|---|---:|
| public | profiles | 1 |
| public | customers | 0 |
| public | leads | 0 |
| public | consultations | 0 |
| public | audit_logs | 0 |
| public | import_batches | 0 |
| public | import_rows | 0 |
| public | courses | 0 |
| public | course_sessions | 0 |
| public | enrollments | 0 |
| public | course_checklist_items | 0 |
| public | payment_transactions | 0 |
| public | refund_requests | 0 |
| public | attendance_records | 0 |
| public | instructors | 0 |
| public | instructor_availability | 0 |
| public | instructor_assignments | 0 |
| legacy_crm | users | 1 |
| legacy_crm | courses | 2 |
| legacy_crm | customers | 0 |
| legacy_crm | applications | 0 |
| legacy_crm | contact_logs | 0 |
| legacy_crm | payments | 0 |
| legacy_crm | notes | 0 |
| legacy_crm | followups | 0 |
| legacy_crm | options | 34 |
| legacy_crm | activity_logs | 0 |

These counts show there is still some legacy configuration and course data. Do not truncate, drop, or overwrite either schema. The profile and legacy user rows should not be assumed to be the same account; verify identity/role mapping without exposing personal data.

## 3. Migration history

The remote migration ledger contains 23 migrations:
- foundation
- archive_legacy_crm_tables
- crm_part_1 / crm_part_2 / crm_part_3
- import_part_1 / import_part_2 / import_part_3 / import_part_4
- programs_part_1 / programs_part_2 / programs_part_3
- payments_attendance_part_1 / _part_2 / _part_3 / _part_4
- instructors_part_1 / _part_2 / _part_3 / _part_4
- security_hardening_rpc_privileges
- storage_runtime_hardening
- import_storage_rls

The GitHub `main` tree inspected during Phase 0 did not contain a committed `supabase/migrations` directory. Recover the canonical migration source from the original development workspace, prior artifacts or trusted backup. Do not regenerate or apply replacement migrations until the remote schema and original SQL have been reconciled.

## 4. Security advisor findings

The Supabase Security Advisor returned warnings, not proof of an exploitable vulnerability. Review function-by-function before changing privileges.

- 32 `SECURITY DEFINER` functions are executable by the authenticated role. Some may be intentionally callable RPC commands with internal authorization checks. Review function bodies, search_path, grants and role checks before revoking or changing SECURITY INVOKER/DEFINER.
- `pg_trgm` extension is installed in `public`.
- Leaked password protection is disabled in Supabase Auth.

**Do not mass-revoke EXECUTE from all 32 functions.** That could break existing CRM, course, payment, refund, attendance and instructor workflows. Create a reviewed least-privilege remediation plan and test on a non-production clone/branch first.

## 5. Performance advisor findings

- 33 foreign keys without covering indexes.
- 3 RLS policies flagged for per-row auth function re-evaluation.
- 54 unused indexes (may simply reflect low usage since restore; do not drop based on this signal alone).
- 6 tables with multiple permissive policies for authenticated SELECT.

These are optimization/review items. No performance changes were applied.

## 6. Health advisor

Health advisor returned no lints in the retrieved result. This does not replace application smoke tests or a backup verification.

## 7. Backup status and limitations

A verified backup artifact/restore point was not confirmed through the available inspection actions. Before any schema migration or production data change:
1. Verify Supabase backup/PITR availability in the dashboard and record its timestamp.
2. Export or otherwise preserve the canonical migration history.
3. Confirm a rollback/recovery plan.
4. Test restore on an isolated environment if available.

Do not claim backup completion until the dashboard or backup evidence confirms it.

## 8. Next safe steps

1. Verify Cloudflare Worker deployment/runtime independently. The deployment URL from Wrangler is `https://aileaders-os.dldltmfzz.workers.dev`, but the web inspection attempt did not establish a successful response.
2. Recover the canonical migration SQL source for the 23 remote migration entries.
3. Verify current admin profile/role mapping and auth login without changing accounts.
4. Verify backup/PITR in Supabase dashboard.
5. Run existing app locally with synthetic/test data and the repository's verification scripts.
6. Review security advisor findings individually and write a remediation plan; do not alter production grants yet.
7. Only after these checks, implement the first AI workflow on the preparation branch and test with synthetic content.

## 9. Explicitly not performed

- No schema migration applied.
- No table, row, user, role, payment or refund data modified.
- No RLS policy or function privilege changed.
- No Supabase Edge Function deployed.
- No paid plan upgrade.
- No production deploy.
