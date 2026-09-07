"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CustomerCrmSummary } from "@aileaders/domain";
import { CalendarClock, Filter, PhoneCall, Plus, Search, Users } from "lucide-react";
import { formatKoreanPhone, normalizeKoreanPhone } from "@aileaders/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CustomerDrawer } from "@/features/customers/components/customer-drawer";
import { NewCustomerModal } from "@/features/customers/components/new-customer-modal";
import { customerTabs, type CustomerTab, leadStatusLabels, leadStatusTones } from "@/features/customers/constants";

export function CustomerWorkspace({ customers, canEdit }: { customers: CustomerCrmSummary[]; canEdit: boolean }) {
  const [tab, setTab] = useState<CustomerTab>("ALL");
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const phoneQ = normalizeKoreanPhone(q);
    return customers.filter((customer) => {
      const matchesTab =
        tab === "ALL" ||
        (tab === "TODAY_FOLLOW_UP" ? isTodaySeoul(customer.follow_up_at) : customer.lead_status === tab);
      if (!matchesTab) return false;
      if (!q) return true;
      return [customer.name, customer.region, customer.offered_course_name, customer.offered_region]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)) ||
        (phoneQ && customer.phone_normalized.includes(phoneQ));
    });
  }, [customers, query, tab]);

  const todayFollowUps = customers.filter((customer) => isTodaySeoul(customer.follow_up_at)).length;
  const overdue = customers.filter((customer) => isOverdueSeoul(customer.follow_up_at)).length;
  const paymentPending = customers.filter((customer) => customer.lead_status === "PAYMENT_PENDING").length;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">CUSTOMERS / CRM</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">고객 · 상담</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#686F7D]">한 고객을 한 번만 등록하고, 상담/재연락/관심 강의는 이력으로 연결합니다.</p>
      </div>
      <div className="flex gap-2">
        <Link href="/customers/follow-up" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#171A20] px-4 text-sm font-medium hover:bg-[#1D2027]"><PhoneCall size={16}/> 재연락 <span className="rounded-full bg-[#FFB84D]/10 px-2 py-0.5 text-[11px] text-[#FFB84D]">{todayFollowUps + overdue}</span></Link>
        {canEdit ? <Button onClick={() => setNewCustomerOpen(true)}><Plus size={16} className="mr-2"/>신규 고객</Button> : null}
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <MiniKpi label="전체 고객" value={customers.length} icon={<Users size={16}/>} />
      <MiniKpi label="오늘 재연락" value={todayFollowUps} tone="warning" icon={<CalendarClock size={16}/>} />
      <MiniKpi label="결제대기" value={paymentPending} tone="warning" icon={<Filter size={16}/>} />
    </div>

    <section className="overflow-hidden rounded-[16px] border border-white/8 bg-[#111318]">
      <div className="border-b border-white/8 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {customerTabs.map((item) => <button key={item.key} onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-[9px] px-3 py-2 text-xs font-medium transition ${tab === item.key ? "bg-white text-[#08090C]" : "text-[#A3A9B5] hover:bg-white/5 hover:text-white"}`}>{item.label}{item.key === "TODAY_FOLLOW_UP" && todayFollowUps ? <span className="ml-1.5">{todayFollowUps}</span> : null}</button>)}
          </div>
          <div className="relative w-full xl:w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686F7D]"/>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 연락처, 지역, 과정 검색" className="h-10 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] pl-9 pr-3 text-sm outline-none placeholder:text-[#484E59] focus:border-[#7C5CFF]" />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[1.25fr_1.3fr_.8fr_1fr_1fr] gap-4 border-b border-white/8 px-5 py-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#686F7D]">
          <div>고객</div><div>관심 과정</div><div>상태</div><div>최근 연락</div><div>다음 행동</div>
        </div>
        {filtered.map((customer) => <button key={customer.customer_id} onClick={() => setSelectedCustomerId(customer.customer_id)} className="grid w-full grid-cols-[1.25fr_1.3fr_.8fr_1fr_1fr] gap-4 border-b border-white/[.055] px-5 py-4 text-left transition last:border-b-0 hover:bg-white/[.025]">
          <div className="min-w-0"><div className="truncate text-sm font-semibold">{customer.name}</div><div className="mt-1 text-xs text-[#686F7D]">{formatKoreanPhone(customer.phone)} · {customer.region || "지역 미입력"}</div></div>
          <div className="min-w-0"><div className="truncate text-sm text-[#D9DCE2]">{customer.offered_course_name || "—"}</div><div className="mt-1 truncate text-xs text-[#686F7D]">{customer.offered_region || "안내 지역 미정"}{customer.lead_count > 1 ? ` · 리드 ${customer.lead_count}건` : ""}</div></div>
          <div>{customer.lead_status ? <StatusBadge tone={leadStatusTones[customer.lead_status]}>{leadStatusLabels[customer.lead_status]}</StatusBadge> : <StatusBadge>미분류</StatusBadge>}</div>
          <div><div className="text-sm text-[#D9DCE2]">{customer.last_contact_at ? formatRelativeDate(customer.last_contact_at) : "미연락"}</div><div className="mt-1 text-xs text-[#686F7D]">접점 {customer.contact_count}회</div></div>
          <NextAction customer={customer}/>
        </button>)}
      </div>

      <div className="divide-y divide-white/[.06] md:hidden">
        {filtered.map((customer) => <button key={customer.customer_id} onClick={() => setSelectedCustomerId(customer.customer_id)} className="w-full p-4 text-left hover:bg-white/[.025]">
          <div className="flex items-start justify-between gap-3"><div><div className="font-semibold">{customer.name}</div><div className="mt-1 text-xs text-[#686F7D]">{formatKoreanPhone(customer.phone)}</div></div>{customer.lead_status ? <StatusBadge tone={leadStatusTones[customer.lead_status]}>{leadStatusLabels[customer.lead_status]}</StatusBadge> : null}</div>
          <div className="mt-3 text-sm text-[#A3A9B5]">{customer.offered_course_name || customer.offered_region || "관심 과정 미입력"}</div>
          <div className="mt-3 flex items-center justify-between text-xs"><span className="text-[#686F7D]">최근 {customer.last_contact_at ? formatRelativeDate(customer.last_contact_at) : "미연락"}</span><NextAction customer={customer} compact /></div>
        </button>)}
      </div>

      {filtered.length === 0 ? <div className="p-14 text-center"><Users size={24} className="mx-auto text-[#484E59]"/><div className="mt-3 text-sm font-medium">조건에 맞는 고객이 없습니다.</div><div className="mt-1 text-xs text-[#686F7D]">검색어나 필터를 변경해보세요.</div></div> : null}
    </section>

    <NewCustomerModal open={newCustomerOpen} onClose={() => setNewCustomerOpen(false)} onOpenCustomer={setSelectedCustomerId} />
    <CustomerDrawer customerId={selectedCustomerId} canEdit={canEdit} onClose={() => setSelectedCustomerId(null)} />
  </div>;
}

function MiniKpi({ label, value, icon, tone = "default" }: { label: string; value: number; icon: React.ReactNode; tone?: "default" | "warning" }) {
  return <div className="rounded-[14px] border border-white/8 bg-[#111318] p-4"><div className={`flex items-center gap-2 text-xs ${tone === "warning" ? "text-[#FFB84D]" : "text-[#686F7D]"}`}>{icon}{label}</div><div className="mt-2 text-2xl font-semibold tracking-tight">{value.toLocaleString("ko-KR")}</div></div>;
}

function NextAction({ customer, compact = false }: { customer: CustomerCrmSummary; compact?: boolean }) {
  if (!customer.follow_up_at) return <div className={compact ? "text-[#686F7D]" : "text-sm text-[#686F7D]"}>—</div>;
  const overdue = isOverdueSeoul(customer.follow_up_at);
  const today = isTodaySeoul(customer.follow_up_at);
  return <div className={overdue || today ? "text-[#FFB84D]" : "text-[#A3A9B5]"}><div className={compact ? "text-xs font-medium" : "text-sm font-medium"}>{overdue ? "지연 재연락" : today ? "오늘 재연락" : formatShortDate(customer.follow_up_at)}</div>{!compact ? <div className="mt-1 truncate text-xs text-[#686F7D]">{customer.follow_up_reason || "후속 연락"}</div> : null}</div>;
}

function seoulDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function isTodaySeoul(value: string | null) { return Boolean(value && seoulDateKey(value) === seoulDateKey(new Date())); }
function isOverdueSeoul(value: string | null) { return Boolean(value && seoulDateKey(value) < seoulDateKey(new Date())); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "short", day: "numeric" }).format(new Date(value)); }
function formatRelativeDate(value: string) {
  const date = new Date(value); const now = new Date(); const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff <= 0) return "오늘"; if (diff === 1) return "1일 전"; if (diff < 30) return `${diff}일 전`; return formatShortDate(value);
}
