# First Vertical Slice — 60-Minute AI Intro Lecture Draft

## Goal
Deliver one end-to-end, testable workflow in the existing AILeaders OS. Do not build the full 27-agent system first.

## Workflow
Representative instruction → task record → temporary Lecture Planning test agent → draft generation → independent reviewer → up to 3 revision rounds → representative decision → audit trail.

## Input
- lecture topic
- target learners
- learner AI skill level
- lecture objective
- desired learner outcome
- required topics
- practical exercise required (yes/no)
- special instructions
- duration default: 60 minutes

## Output
1. title
2. audience and skill level
3. objectives
4. learning outcomes
5. agenda totaling exactly 60 minutes
6. time-boxed content and trainer guidance
7. practical exercise and required tools
8. learner deliverable
9. wrap-up and review
10. delivery cautions

## Reviewer rubric
- exactly 60 minutes
- content aligned to learning objective
- suitable for target skill level
- beginner comprehensibility
- exercise time is sufficient
- exercise supports the objective
- logical sequence
- no major omissions or duplication
- feasible in a real classroom

Reviewer returns score, per-criterion findings, defects, revision requests, and recommendation. A reviewer must be independent of the drafting agent and must not auto-approve its own output.

## Revision policy
- Maximum 3 automated revision rounds.
- If still below configured acceptance threshold, set status to NEEDS_REPRESENTATIVE_REVIEW.
- Never mark complete solely because a model returned text.
- Representative actions: APPROVE, REQUEST_CHANGES, HOLD.
- No outbound message, payment, external publication, or production data mutation in this first slice.

## Data model proposal (review before migration)
- tasks: id, title, request_payload, status, created_by, assigned_agent_id, project_id, due_at, created_at, updated_at
- task_runs: id, task_id, agent_id, run_number, provider, model, input_ref, output_ref, status, started_at, finished_at, error_code, token_usage
- reviews: id, task_id, task_run_id, reviewer_agent_id, rubric_version, score, findings_json, recommendation, created_at
- approval_requests: id, task_id, submitted_run_id, status, representative_id, decision_note, decided_at
- task_events: id, task_id, actor_type, actor_id, event_type, payload_json, created_at

## Acceptance tests
1. Representative can submit a lecture task.
2. Task receives a unique ID and initial status.
3. Test agent receives the task with only authorized input.
4. Draft contains all required sections.
5. Agenda sums to exactly 60 minutes.
6. Reviewer evaluates independently.
7. Defects trigger a revision request.
8. Revision history is preserved.
9. Three unsuccessful rounds trigger representative review.
10. Representative can approve, request changes, or hold.
11. All events are auditable.
12. Tests use synthetic data and no outbound actions.

## Implementation constraints
- First inspect existing task, audit, role and notification abstractions; reuse them if suitable.
- Do not add duplicate auth, task tables, or a parallel database.
- Do not apply schema migrations until the actual Supabase project is active, backup is confirmed, and migration history is reconciled.
- Do not deploy production from this work branch.
