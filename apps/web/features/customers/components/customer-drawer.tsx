"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import type { CustomerDetail, LeadStatus } from "@aileaders/domain";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  LoaderCircle,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";
import { formatKoreanPhone } from "@aileaders/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getCustomerDetailAction,
  updateLeadStatusAction,
} from "@/features/customers/actions";
import {
  contactResultLabels,
  contactTypeLabels,
  leadStatusLabels,
  leadStatusTones,
  priorityLabels,
  sourceLabels,
} from "@/features/customers/constants";
import { ConsultationModal } from "@/features/customers/components/consultation-modal";
import { LeadModal } from "@/features/customers/components/lead-modal";

export function CustomerDrawer({
  customerId,
  canEdit,
  onClose,
}: {
  customerId: string | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  if (!customerId) return null;

  return (
    <CustomerDrawerContent
      key={customerId}
      customerId={customerId}
      canEdit={canEdit}
      onClose={onClose}
    />
  );
}

function CustomerDrawerContent({
  customerId,
  canEdit,
  onClose,
}: {
  customerId: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [statusPending, startStatusTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await getCustomerDetailAction(customerId);
    if (!result.ok) setError(result.error);
    else setDetail(result.data);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);
  const currentLead = detail?.leads[0] ?? null;
  const openFollowUp = useMemo(
    () =>
      detail?.consultations.find(
        (c) => c.follow_up_required && !c.follow_up_completed_at,
      ) ?? null,
    [detail],
  );

  function changeStatus(status: LeadStatus) {
    if (!currentLead) return;
    startStatusTransition(async () => {
      const result = await updateLeadStatusAction(currentLead.id, status);
      if (result.ok) {
        await load();
        router.refresh();
      }
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:bg-black/30"
        onMouseDown={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto border-l border-white/8 bg-[#111318] shadow-2xl md:w-[500px]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/8 bg-[#111318]/95 px-5 py-5 backdrop-blur md:px-6">
          <div>
            <div className="text-[10px] font-semibold tracking-[.2em] text-[#686F7D]">
              CUSTOMER PROFILE
            </div>
            {detail ? (
              <>
                <h2 className="mt-1 text-2xl font-semibold">
                  {detail.customer.name}
                </h2>
                <div className="mt-1 text-sm text-[#A3A9B5]">
                  {formatKoreanPhone(detail.customer.phone)}
                </div>
              </>
            ) : (
              <div className="mt-2 h-12 w-36 animate-pulse rounded bg-white/5" />
            )}
          </div>
          <button
            aria-label="닫기"
            onClick={onClose}
            className="rounded-lg p-2 text-[#686F7D] hover:bg-white/5 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5 md:p-6">
          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center text-[#686F7D]">
              <LoaderCircle size={22} className="animate-spin" />
            </div>
          ) : null}
          {error ? (
            <div className="rounded-[14px] border border-[#FF5C5C]/25 bg-[#FF5C5C]/8 p-4 text-sm text-[#FF7A7A]">
              {error}
            </div>
          ) : null}
          {detail ? (
            <div className="space-y-7">
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`tel:${detail.customer.phone_normalized}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#F5F7FA] text-sm font-medium text-[#08090C]"
                >
                  <Phone size={16} />
                  전화
                </a>
                <a
                  href={`sms:${detail.customer.phone_normalized}`}
                  className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#171A20] text-sm font-medium"
                >
                  <MessageSquare size={16} />
                  문자
                </a>
                <button
                  disabled={!canEdit}
                  onClick={() => setConsultationOpen(true)}
                  className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#171A20] text-sm font-medium disabled:opacity-40"
                >
                  <CalendarClock size={16} />
                  상담
                </button>
              </div>

              <section className="rounded-[16px] border border-white/8 bg-[#0D0F13] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold tracking-[.16em] text-[#686F7D]">
                      CURRENT LEAD
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {currentLead?.offered_course_name ||
                        currentLead?.offered_region ||
                        "일반 상담"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentLead ? (
                      <StatusBadge tone={leadStatusTones[currentLead.status]}>
                        {leadStatusLabels[currentLead.status]}
                      </StatusBadge>
                    ) : null}
                    {canEdit ? (
                      <button
                        onClick={() => setLeadOpen(true)}
                        className="rounded-[8px] border border-white/10 px-2.5 py-1.5 text-[11px] text-[#A3A9B5] hover:bg-white/5 hover:text-white"
                      >
                        + 관심 과정
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <Info label="안내 지역" value={currentLead?.offered_region} />
                  <Info
                    label="안내 일정"
                    value={formatDate(currentLead?.offered_date)}
                  />
                  <Info
                    label="유입 강의"
                    value={currentLead?.origin_course_name}
                  />
                  <Info
                    label="유입 지역"
                    value={currentLead?.origin_region || detail.customer.region}
                  />
                </div>
                {canEdit && currentLead ? (
                  <label className="mt-4 block text-[11px] text-[#686F7D]">
                    상태 변경
                    <select
                      disabled={statusPending}
                      value={currentLead.status}
                      onChange={(e) =>
                        changeStatus(e.target.value as LeadStatus)
                      }
                      className="mt-2 h-10 w-full rounded-[9px] border border-white/10 bg-[#111318] px-3 text-sm text-white outline-none focus:border-[#7C5CFF]"
                    >
                      {Object.entries(leadStatusLabels).map(
                        ([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ) : null}
              </section>

              {openFollowUp ? (
                <section className="rounded-[16px] border border-[#FFB84D]/20 bg-[#FFB84D]/6 p-4">
                  <div className="flex items-center gap-2 text-[#FFB84D]">
                    <CalendarClock size={16} />
                    <span className="text-[11px] font-semibold tracking-[.12em]">
                      NEXT ACTION
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {formatDateTime(openFollowUp.follow_up_at)}
                  </div>
                  <div className="mt-1 text-sm text-[#A3A9B5]">
                    {openFollowUp.follow_up_reason || "재연락 예정"}
                  </div>
                  <div className="mt-2 text-xs text-[#686F7D]">
                    우선순위 {priorityLabels[openFollowUp.follow_up_priority]}
                  </div>
                </section>
              ) : null}

              <section>
                <SectionHead
                  title="고객 정보"
                  count={detail.leads.length}
                  suffix="개 리드"
                />
                <div className="mt-3 grid grid-cols-2 gap-3 rounded-[14px] border border-white/8 p-4 text-xs">
                  <Info label="지역" value={detail.customer.region} />
                  <Info
                    label="유입"
                    value={sourceLabels[detail.customer.source_type]}
                  />
                  <Info
                    label="유입 상세"
                    value={detail.customer.source_detail}
                  />
                  <Info
                    label="등록일"
                    value={formatDate(detail.customer.created_at)}
                  />
                </div>
                {detail.customer.memo ? (
                  <div className="mt-3 rounded-[12px] bg-white/[.03] p-3 text-sm leading-6 text-[#A3A9B5]">
                    {detail.customer.memo}
                  </div>
                ) : null}
              </section>

              <section>
                <SectionHead
                  title="상담 타임라인"
                  count={detail.consultations.length}
                  suffix="건"
                />
                <div className="mt-4 space-y-0">
                  {detail.consultations.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed border-white/10 p-8 text-center text-sm text-[#686F7D]">
                      아직 상담 기록이 없습니다.
                    </div>
                  ) : (
                    detail.consultations.map((item, index) => (
                      <div key={item.id} className="relative flex gap-4 pb-6">
                        {index < detail.consultations.length - 1 ? (
                          <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/8" />
                        ) : null}
                        <div className="relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-[#111318] bg-[#7C5CFF] ring-1 ring-[#7C5CFF]/35" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">
                              {contactResultLabels[item.result]}
                            </span>
                            <span className="text-[11px] text-[#686F7D]">
                              {contactTypeLabels[item.contact_type]} ·{" "}
                              {item.contact_round > 3
                                ? "3차+"
                                : `${item.contact_round}차`}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[#686F7D]">
                            {item.contact_at
                              ? formatDateTime(item.contact_at)
                              : "원본 연락일 미확인"}
                          </div>
                          {item.note ? (
                            <p className="mt-2 text-sm leading-6 text-[#A3A9B5]">
                              {item.note}
                            </p>
                          ) : null}
                          {item.follow_up_required ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFB84D]/8 px-2.5 py-1 text-[11px] text-[#FFB84D]">
                              {item.follow_up_completed_at ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <CalendarClock size={12} />
                              )}{" "}
                              {item.follow_up_completed_at
                                ? "재연락 처리됨"
                                : `${formatDateTime(item.follow_up_at)} 재연락`}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {detail.leads.some((lead) => lead.legacy_note) ? (
                <section>
                  <SectionHead title="기존 엑셀 메모" />
                  <div className="mt-3 space-y-2">
                    {detail.leads
                      .filter((lead) => lead.legacy_note)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          className="rounded-[12px] border border-white/8 bg-white/[.02] p-3 text-xs leading-5 text-[#A3A9B5]"
                        >
                          <div className="mb-1 text-[10px] text-[#686F7D]">
                            {lead.legacy_sheet} ·{" "}
                            {lead.legacy_row ? `${lead.legacy_row}행` : "원본"}
                          </div>
                          {lead.legacy_note}
                        </div>
                      ))}
                  </div>
                </section>
              ) : null}

              <div className="flex items-center gap-2 border-t border-white/8 pt-5 text-xs text-[#686F7D]">
                <Copy size={13} /> 고객 ID {detail.customer.id.slice(0, 8)}…
              </div>
            </div>
          ) : null}
        </div>
      </aside>
      {detail ? (
        <ConsultationModal
          open={consultationOpen}
          customerId={detail.customer.id}
          leads={detail.leads}
          onClose={() => setConsultationOpen(false)}
          onSaved={() => void load()}
        />
      ) : null}
      {detail ? (
        <LeadModal
          open={leadOpen}
          customerId={detail.customer.id}
          onClose={() => setLeadOpen(false)}
          onSaved={() => void load()}
        />
      ) : null}
    </>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#686F7D]">
        {label}
      </div>
      <div className="mt-1 break-words text-sm text-[#D9DCE2]">
        {value || "—"}
      </div>
    </div>
  );
}
function SectionHead({
  title,
  count,
  suffix,
}: {
  title: string;
  count?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      {typeof count === "number" ? (
        <span className="text-xs text-[#686F7D]">
          {count}
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
