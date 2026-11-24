"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerSearchOption } from "@aileaders/domain";
import { Search, X } from "lucide-react";
import { formatKoreanPhone } from "@aileaders/utils";
import { Button } from "@/components/ui/button";
import {
  createEnrollmentAction,
  searchEnrollmentCustomersAction,
} from "@/features/programs/actions";

export function EnrollmentModal({
  open,
  onClose,
  courseId,
  basePrice,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  basePrice: number;
}) {
  if (!open) return null;

  return (
    <EnrollmentModalContent
      key={courseId}
      onClose={onClose}
      courseId={courseId}
      basePrice={basePrice}
    />
  );
}

function EnrollmentModalContent({
  onClose,
  courseId,
  basePrice,
}: {
  onClose: () => void;
  courseId: string;
  basePrice: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerSearchOption[]>([]);
  const [selected, setSelected] = useState<CustomerSearchOption | null>(null);
  const [leadId, setLeadId] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const search = () =>
    startTransition(async () => {
      const r = await searchEnrollmentCustomersAction(q);
      if (r.ok) setResults(r.data);
      else setError(r.error);
    });
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm md:items-center md:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!selected) {
            setError("고객을 선택해주세요.");
            return;
          }
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const r = await createEnrollmentAction({
              course_id: courseId,
              customer_id: selected.id,
              lead_id: leadId,
              application_source: "MANUAL",
              list_price: basePrice,
              discount_amount: discount,
              discount_reason: String(fd.get("discount_reason") || ""),
              memo: String(fd.get("memo") || ""),
            });
            if (!r.ok) {
              setError(r.error);
              return;
            }
            onClose();
            router.refresh();
          });
        }}
        className="w-full rounded-t-[22px] border border-white/10 bg-[#111318] p-5 md:max-w-[620px] md:rounded-[22px] md:p-7"
      >
        <div className="flex justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">
              APPLICANT
            </div>
            <h2 className="mt-2 text-2xl font-semibold">신청자 추가</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {!selected ? (
          <>
            <div className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686F7D]"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      search();
                    }
                  }}
                  placeholder="이름 또는 전화번호"
                  className="h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] pl-9 pr-3 text-sm outline-none focus:border-[#7C5CFF]"
                />
              </div>
              <Button type="button" variant="secondary" onClick={search}>
                검색
              </Button>
            </div>
            <div className="mt-3 max-h-[330px] space-y-2 overflow-y-auto">
              {results.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setSelected(c);
                    setLeadId(c.leads[0]?.id ?? "");
                  }}
                  className="w-full rounded-xl border border-white/8 bg-[#0D0F13] p-4 text-left hover:border-white/15"
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="mt-1 text-xs text-[#686F7D]">
                    {formatKoreanPhone(c.phone)} · {c.region || "지역 미정"}
                  </div>
                  {c.leads.length ? (
                    <div className="mt-2 text-xs text-[#A3A9B5]">
                      관심 이력 {c.leads.length}건 ·{" "}
                      {c.leads[0]?.offered_course_name ||
                        c.leads[0]?.offered_region ||
                        "미분류"}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6">
            <div className="rounded-xl border border-[#7C5CFF]/25 bg-[#7C5CFF]/8 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{selected.name}</div>
                  <div className="mt-1 text-xs text-[#A3A9B5]">
                    {formatKoreanPhone(selected.phone)} ·{" "}
                    {selected.region || "지역 미정"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs text-[#A3A9B5]"
                >
                  다시 선택
                </button>
              </div>
            </div>
            {selected.leads.length ? (
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs text-[#A3A9B5]">
                  연결할 상담/관심 이력
                </span>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">연결하지 않음</option>
                  {selected.leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.offered_course_name || l.offered_region || l.status}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs text-[#A3A9B5]">
                  정상가
                </span>
                <div className="flex h-11 items-center rounded-[10px] border border-white/8 bg-white/[.03] px-3 text-sm">
                  ₩{basePrice.toLocaleString("ko-KR")}
                </div>
              </label>
              <label>
                <span className="mb-1.5 block text-xs text-[#A3A9B5]">
                  할인금액
                </span>
                <input
                  type="number"
                  min="0"
                  max={basePrice}
                  step="1000"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(Math.max(0, Number(e.target.value)))
                  }
                  className={inputCls}
                />
              </label>
            </div>
            <div className="mt-3 text-right text-sm text-[#A3A9B5]">
              최종 수강료{" "}
              <strong className="ml-2 text-lg text-white">
                ₩{Math.max(0, basePrice - discount).toLocaleString("ko-KR")}
              </strong>
            </div>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs text-[#A3A9B5]">
                할인 사유
              </span>
              <input
                name="discount_reason"
                placeholder="예: 2인 동반 할인"
                className={inputCls}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs text-[#A3A9B5]">메모</span>
              <textarea
                name="memo"
                rows={3}
                className={`${inputCls} h-auto py-3`}
              />
            </label>
          </div>
        )}
        {error ? (
          <div className="mt-4 rounded-xl bg-[#FF5C5C]/10 p-3 text-sm text-[#FF7A7A]">
            {error}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          {selected ? (
            <Button disabled={pending}>
              {pending ? "등록 중..." : "신청자 등록"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
const inputCls =
  "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm outline-none focus:border-[#7C5CFF]";
