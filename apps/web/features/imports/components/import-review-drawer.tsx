"use client";

import { useState, useTransition } from "react";
import type { ImportRow } from "@aileaders/domain";
import {
  CalendarClock,
  Check,
  Phone,
  Save,
  SkipForward,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { reviewImportRowAction } from "@/features/imports/actions";
import {
  effectiveClassification,
  effectiveNormalized,
} from "@/features/imports/view-utils";

const results = [
  ["CONNECTED", "응답/연결"],
  ["NO_ANSWER", "전화 부재"],
  ["CALLBACK", "재연락"],
  ["CONSIDERING", "고민중"],
  ["PAYMENT_PROMISED", "입금 예정"],
  ["NOT_INTERESTED", "관심 없음"],
  ["SCHEDULE_CONFLICT", "일정 불가"],
  ["PRICE_OBJECTION", "가격 부담"],
  ["INVALID_NUMBER", "번호 오류"],
  ["INFO_SENT", "안내 발송"],
  ["OTHER", "기타"],
] as const;
const statuses = [
  ["NEW", "신규"],
  ["CONTACTING", "연락중"],
  ["CONSULTED", "상담완료"],
  ["PAYMENT_PENDING", "결제대기"],
  ["PAID", "결제완료"],
  ["COMPLETED", "수강완료"],
  ["CANCELLED", "취소"],
  ["REFUNDED", "환불"],
  ["LOST", "종료"],
] as const;

export function ImportReviewDrawer({
  row,
  onClose,
  onSaved,
}: {
  row: ImportRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!row) return null;

  return (
    <ImportReviewDrawerContent
      key={row.id}
      row={row}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function ImportReviewDrawerContent({
  row,
  onClose,
  onSaved,
}: {
  row: ImportRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ReviewState>(() => buildState(row));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (reviewStatus: "PENDING" | "APPROVED" | "SKIPPED") =>
    startTransition(async () => {
      setMessage(null);
      const result = await reviewImportRowAction({
        rowId: row.id,
        batchId: row.batch_id,
        reviewStatus,
        normalized: {
          name: form.name,
          phone: form.phone,
          region: form.region || null,
        },
        classification: {
          result: form.result,
          lead_status: form.leadStatus,
          follow_up_required: form.followUpRequired,
          follow_up_date: form.followUpDate || null,
          follow_up_reason: form.followUpReason || null,
          follow_up_priority: form.followUpPriority,
          summary: form.summary,
          signals: form.signals,
          confidence: form.confidence,
          needs_review: reviewStatus === "APPROVED" ? false : form.needsReview,
        },
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      onSaved();
    });

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="h-full w-full overflow-y-auto border-l border-white/10 bg-[#111318] p-5 shadow-2xl md:w-[540px] md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold tracking-[.16em] text-[#7C5CFF]">
              IMPORT REVIEW
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              {row.sheet_name} · {row.sheet_row}행
            </h2>
            <div className="mt-2 flex gap-2">
              <StatusBadge>{row.classification_engine}</StatusBadge>
              <StatusBadge>
                {row.sheet_kind === "CONFIRMED" ? "유료 확정" : "상담"}
              </StatusBadge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[9px] p-2 text-[#686F7D] hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {row.match_context.matched_name ? (
          <section className="mt-6 rounded-[14px] border border-[#FFB84D]/20 bg-[#FFB84D]/[.06] p-4">
            <div className="text-xs font-semibold text-[#FFB84D]">
              중복 고객 확인
            </div>
            <div className="mt-2 text-sm text-[#D9DCE2]">
              동일 연락처에 연결된 비교 이름:{" "}
              <span className="font-semibold text-white">
                {row.match_context.matched_name}
              </span>
            </div>
            <div className="mt-1 text-xs leading-5 text-[#8C8271]">
              현재 행 이름과 다르면 같은 사람인지 확인한 뒤 승인하세요. 다른
              사람이면 연락처를 수정하거나 이 행을 제외하세요.
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-[14px] border border-white/8 bg-[#0D0F13] p-4">
          <div className="text-xs font-semibold text-[#A3A9B5]">
            원본 Legacy 메모
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#D9DCE2]">
            {row.normalized_data.legacy_note || "메모 없음"}
          </div>
          <div className="mt-3 text-[11px] text-[#686F7D]">
            원본 시트/행은 Import 이후에도 lead.legacy_sheet / legacy_row /
            legacy_note로 보존됩니다.
          </div>
        </section>

        <Section title="고객 식별정보">
          <Field label="이름">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="연락처">
            <div className="relative">
              <Phone
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686F7D]"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputClass} pl-9`}
              />
            </div>
          </Field>
          <Field label="지역">
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section title="상담 분류">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="상담 결과">
              <select
                value={form.result}
                onChange={(e) =>
                  setForm({
                    ...form,
                    result: e.target.value as ReviewState["result"],
                  })
                }
                className={inputClass}
              >
                {results.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="리드 상태">
              <select
                value={form.leadStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    leadStatus: e.target.value as ReviewState["leadStatus"],
                  })
                }
                className={inputClass}
              >
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="분류 요약">
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className={`${inputClass} min-h-20 py-3`}
            />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {form.signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-[#A3A9B5]"
              >
                {signal}
              </span>
            ))}
          </div>
        </Section>

        <Section title="재연락">
          <label className="flex items-center justify-between rounded-[12px] border border-white/8 bg-[#0D0F13] p-3">
            <div>
              <div className="text-sm font-medium">재연락 필요</div>
              <div className="mt-1 text-xs text-[#686F7D]">
                애매한 ‘8월 말’ 같은 표현은 정확한 날짜를 정한 후 승인하세요.
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.followUpRequired}
              onChange={(e) =>
                setForm({ ...form, followUpRequired: e.target.checked })
              }
              className="h-4 w-4 accent-[#7C5CFF]"
            />
          </label>
          {form.followUpRequired ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="재연락 날짜">
                  <div className="relative">
                    <CalendarClock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686F7D]"
                    />
                    <input
                      type="date"
                      value={form.followUpDate}
                      onChange={(e) =>
                        setForm({ ...form, followUpDate: e.target.value })
                      }
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>
                <Field label="우선순위">
                  <select
                    value={form.followUpPriority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        followUpPriority: e.target
                          .value as ReviewState["followUpPriority"],
                      })
                    }
                    className={inputClass}
                  >
                    <option value="HIGH">높음</option>
                    <option value="NORMAL">보통</option>
                    <option value="LOW">낮음</option>
                  </select>
                </Field>
              </div>
              <Field label="재연락 사유">
                <input
                  value={form.followUpReason}
                  onChange={(e) =>
                    setForm({ ...form, followUpReason: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </>
          ) : null}
        </Section>

        <section className="mt-5 rounded-[14px] border border-white/8 bg-[#0D0F13] p-4 text-xs text-[#686F7D]">
          <div className="font-medium text-[#A3A9B5]">기존 연락기록</div>
          {(row.normalized_data.contact_events ?? []).length ? (
            <div className="mt-2 space-y-1.5">
              {(row.normalized_data.contact_events ?? []).map(
                (event, index) => (
                  <div key={`${event.round}-${event.contact_at ?? index}`}>
                    {event.round}차 ·{" "}
                    {event.contact_at
                      ? new Intl.DateTimeFormat("ko-KR", {
                          timeZone: "Asia/Seoul",
                          dateStyle: "medium",
                        }).format(new Date(event.contact_at))
                      : "날짜 미상"}
                    {event.note ? ` · ${event.note}` : ""}
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-2">없음</div>
          )}
          <div className="mt-1">
            분류 신뢰도: {Math.round(form.confidence * 100)}%
          </div>
        </section>

        {message ? (
          <div className="mt-4 rounded-[10px] bg-[#FF5C5C]/10 px-3 py-2 text-sm text-[#FF8B8B]">
            {message}
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap gap-2 border-t border-white/8 bg-[#111318]/95 px-5 py-4 backdrop-blur md:-mx-6 md:px-6">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => save("PENDING")}
          >
            <Save size={15} className="mr-2" />
            수정 저장
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => save("SKIPPED")}
          >
            <SkipForward size={15} className="mr-2" />
            제외
          </Button>
          <Button
            disabled={pending || (form.followUpRequired && !form.followUpDate)}
            onClick={() => save("APPROVED")}
          >
            <Check size={15} className="mr-2" />
            승인
          </Button>
        </div>
      </aside>
    </div>
  );
}

interface ReviewState {
  name: string;
  phone: string;
  region: string;
  result:
    | "CONNECTED"
    | "NO_ANSWER"
    | "CALLBACK"
    | "CONSIDERING"
    | "PAYMENT_PROMISED"
    | "NOT_INTERESTED"
    | "SCHEDULE_CONFLICT"
    | "PRICE_OBJECTION"
    | "INVALID_NUMBER"
    | "INFO_SENT"
    | "OTHER";
  leadStatus:
    | "NEW"
    | "CONTACTING"
    | "CONSULTED"
    | "PAYMENT_PENDING"
    | "PAID"
    | "COMPLETED"
    | "CANCELLED"
    | "REFUNDED"
    | "LOST";
  followUpRequired: boolean;
  followUpDate: string;
  followUpReason: string;
  followUpPriority: "HIGH" | "NORMAL" | "LOW";
  summary: string;
  signals: string[];
  confidence: number;
  needsReview: boolean;
}

function buildState(row: ImportRow): ReviewState {
  const normalized = effectiveNormalized(row);
  const classification = effectiveClassification(row);
  return {
    name: normalized.name,
    phone: normalized.phone,
    region: normalized.region ?? "",
    result: classification.result,
    leadStatus: classification.lead_status,
    followUpRequired: classification.follow_up_required,
    followUpDate: classification.follow_up_at?.slice(0, 10) ?? "",
    followUpReason: classification.follow_up_reason ?? "",
    followUpPriority: classification.follow_up_priority,
    summary: classification.summary,
    signals: classification.signals,
    confidence: classification.confidence,
    needsReview: classification.needs_review,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#A3A9B5]">
        {label}
      </span>
      {children}
    </label>
  );
}
const inputClass =
  "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm text-white outline-none focus:border-[#7C5CFF]";
