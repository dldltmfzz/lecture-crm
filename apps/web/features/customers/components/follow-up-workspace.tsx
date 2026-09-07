"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FollowUpRow } from "@aileaders/domain";
import { ArrowLeft, Check, Clock3, MessageSquare, Phone, Search } from "lucide-react";
import { formatKoreanPhone, normalizeKoreanPhone } from "@aileaders/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CustomerDrawer } from "@/features/customers/components/customer-drawer";
import { completeFollowUpAction } from "@/features/customers/actions";
import { leadStatusLabels, leadStatusTones } from "@/features/customers/constants";

type Bucket = "TODAY" | "OVERDUE" | "TOMORROW" | "THIS_WEEK";
const buckets: { key: Bucket; label: string }[] = [
  { key: "TODAY", label: "오늘" },
  { key: "OVERDUE", label: "지연" },
  { key: "TOMORROW", label: "내일" },
  { key: "THIS_WEEK", label: "이번 주" },
];

export function FollowUpWorkspace({ rows, canEdit }: { rows: FollowUpRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [bucket, setBucket] = useState<Bucket>("TODAY");
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => Object.fromEntries(buckets.map((item) => [item.key, rows.filter((row) => item.key === "THIS_WEEK" ? row.due_bucket === "THIS_WEEK" : row.due_bucket === item.key).length])) as Record<Bucket, number>, [rows]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase(); const phoneQ = normalizeKoreanPhone(q);
    return rows.filter((row) => row.due_bucket === bucket).filter((row) => !q || row.name.toLowerCase().includes(q) || (phoneQ && normalizeKoreanPhone(row.phone).includes(phoneQ)) || row.offered_course_name?.toLowerCase().includes(q) || row.offered_region?.toLowerCase().includes(q));
  }, [rows, bucket, query]);

  function complete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await completeFollowUpAction(id);
      setPendingId(null);
      router.refresh();
    });
  }

  return <div className="space-y-6">
    <div>
      <Link href="/customers" className="inline-flex items-center gap-2 text-xs text-[#686F7D] hover:text-white"><ArrowLeft size={14}/>고객 목록</Link>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-[11px] font-semibold tracking-[.18em] text-[#FFB84D]">FOLLOW-UP QUEUE</div><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">재연락</h1><p className="mt-2 text-sm text-[#686F7D]">엑셀의 ‘9월초 재연락’, ‘입금 확인’ 같은 메모를 실제 일정으로 처리합니다.</p></div><div className="rounded-[14px] border border-[#FFB84D]/20 bg-[#FFB84D]/5 px-5 py-3"><div className="text-[10px] font-semibold tracking-[.12em] text-[#FFB84D]">ACTION REQUIRED</div><div className="mt-1 text-2xl font-semibold">{counts.TODAY + counts.OVERDUE}<span className="ml-1 text-sm font-normal text-[#A3A9B5]">명</span></div></div></div>
    </div>

    <section className="rounded-[16px] border border-white/8 bg-[#111318]">
      <div className="border-b border-white/8 p-4 md:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-1 overflow-x-auto">{buckets.map((item) => <button key={item.key} onClick={() => setBucket(item.key)} className={`whitespace-nowrap rounded-[9px] px-3 py-2 text-xs font-medium ${bucket === item.key ? "bg-white text-[#08090C]" : "text-[#A3A9B5] hover:bg-white/5"}`}>{item.label} <span className="ml-1 opacity-70">{counts[item.key]}</span></button>)}</div><div className="relative lg:w-[280px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686F7D]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="h-10 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] pl-9 pr-3 text-sm outline-none placeholder:text-[#484E59] focus:border-[#7C5CFF]" placeholder="이름, 연락처, 과정 검색"/></div></div></div>
      <div className="divide-y divide-white/[.06]">
        {filtered.map((row) => <div key={row.consultation_id} className="p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button onClick={() => setSelectedCustomerId(row.customer_id)} className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2"><span className="text-base font-semibold">{row.name}</span>{row.lead_status ? <StatusBadge tone={leadStatusTones[row.lead_status]}>{leadStatusLabels[row.lead_status]}</StatusBadge> : null}{row.follow_up_priority === "HIGH" ? <StatusBadge tone="danger">긴급</StatusBadge> : null}</div>
              <div className="mt-1 text-xs text-[#686F7D]">{formatKoreanPhone(row.phone)} · {row.offered_course_name || row.offered_region || "일반 상담"} · {row.contact_round > 3 ? "3차+" : `${row.contact_round}차`} 연락</div>
              <div className="mt-3 flex items-center gap-2 text-sm text-[#D9DCE2]"><Clock3 size={14} className={row.due_bucket === "OVERDUE" ? "text-[#FF5C5C]" : "text-[#FFB84D]"}/><span>{formatDateTime(row.follow_up_at)}</span><span className="text-[#686F7D]">· {row.follow_up_reason || "재연락"}</span></div>
              {row.previous_note ? <div className="mt-2 max-w-3xl truncate text-xs text-[#686F7D]">이전 메모: {row.previous_note}</div> : null}
            </button>
            <div className="flex shrink-0 gap-2">
              <a href={`tel:${normalizeKoreanPhone(row.phone)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] bg-white px-3 text-xs font-semibold text-[#08090C]"><Phone size={14}/>전화</a>
              <a href={`sms:${normalizeKoreanPhone(row.phone)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-[9px] border border-white/10 bg-[#171A20] px-3 text-xs font-medium"><MessageSquare size={14}/>문자</a>
              <Button variant="secondary" className="h-10 px-3 text-xs" onClick={() => setSelectedCustomerId(row.customer_id)}>상담 기록</Button>
              {canEdit ? <Button variant="ghost" className="h-10 px-3 text-xs text-[#48C78E]" disabled={pendingId === row.consultation_id} onClick={() => complete(row.consultation_id)}><Check size={14} className="mr-1"/>{pendingId === row.consultation_id ? "처리 중" : "완료"}</Button> : null}
            </div>
          </div>
        </div>)}
        {filtered.length === 0 ? <div className="p-14 text-center text-sm text-[#686F7D]">이 구간에 처리할 재연락이 없습니다.</div> : null}
      </div>
    </section>
    <CustomerDrawer customerId={selectedCustomerId} canEdit={canEdit} onClose={() => setSelectedCustomerId(null)} />
  </div>;
}

function formatDateTime(value: string) { return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "short", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); }
