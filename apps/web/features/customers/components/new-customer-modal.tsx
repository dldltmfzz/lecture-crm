"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, LoaderCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkPhoneDuplicateAction, createCustomerAction } from "@/features/customers/actions";
import { sourceLabels } from "@/features/customers/constants";

type Duplicate = { customerId: string; name: string; phone: string } | null;

export function NewCustomerModal({
  open,
  onClose,
  onOpenCustomer,
}: {
  open: boolean;
  onClose: () => void;
  onOpenCustomer: (customerId: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [duplicate, setDuplicate] = useState<Duplicate>(null);
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "checking" | "available">("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  if (!open) return null;

  async function checkPhone(value: string) {
    setDuplicate(null);
    setPhoneStatus("checking");
    const result = await checkPhoneDuplicateAction(value);
    if (result.ok) {
      setDuplicate(result.data);
      setPhoneStatus(result.data ? "idle" : "available");
    } else {
      setPhoneStatus("idle");
    }
  }

  function submit(formData: FormData) {
    setError("");
    setFieldErrors({});
    const values = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const result = await createCustomerAction(values);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if ("duplicateCustomerId" in result.data) {
        onClose();
        onOpenCustomer(result.data.duplicateCustomerId);
        return;
      }
      router.refresh();
      onClose();
      onOpenCustomer(result.data.customerId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6" onMouseDown={onClose}>
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[24px] border border-white/10 bg-[#111318] shadow-2xl md:max-w-[720px] md:rounded-[20px]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/8 bg-[#111318]/95 px-5 py-5 backdrop-blur md:px-7">
          <div>
            <div className="text-[11px] font-semibold tracking-[.2em] text-[#7C5CFF]">NEW CUSTOMER</div>
            <h2 className="mt-1 text-xl font-semibold">신규 고객 등록</h2>
            <p className="mt-1 text-sm text-[#686F7D]">사람은 한 번만 등록하고, 관심 강의/상담 이력은 별도로 연결합니다.</p>
          </div>
          <button aria-label="닫기" onClick={onClose} className="rounded-lg p-2 text-[#686F7D] hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>

        <form action={submit} className="space-y-7 p-5 md:p-7">
          <section>
            <SectionTitle title="기본 정보" description="엑셀의 이름·연락처·수강지역에 해당합니다." />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="이름 *" error={fieldErrors.name?.[0]}><input name="name" required className={inputClass} placeholder="홍길동" /></Field>
              <Field label="연락처 *" error={fieldErrors.phone?.[0]}>
                <div className="relative">
                  <input name="phone" required className={`${inputClass} pr-10`} placeholder="010-0000-0000" onBlur={(event) => void checkPhone(event.currentTarget.value)} />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#686F7D]">
                    {phoneStatus === "checking" ? <LoaderCircle size={16} className="animate-spin" /> : phoneStatus === "available" ? <Check size={16} className="text-[#48C78E]" /> : <Search size={16} />}
                  </div>
                </div>
              </Field>
              <Field label="지역"><input name="region" className={inputClass} placeholder="서울 / 제주 / 부산" /></Field>
              <Field label="이메일"><input name="email" type="email" className={inputClass} placeholder="name@example.com" /></Field>
            </div>

            {duplicate ? (
              <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-[#FFB84D]/25 bg-[#FFB84D]/8 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#FFB84D]" />
                  <div>
                    <div className="text-sm font-semibold">이미 등록된 연락처입니다.</div>
                    <div className="mt-1 text-xs text-[#A3A9B5]">{duplicate.name} · {duplicate.phone}</div>
                  </div>
                </div>
                <Button type="button" variant="secondary" className="h-9" onClick={() => { onClose(); onOpenCustomer(duplicate.customerId); }}>기존 고객 열기</Button>
              </div>
            ) : null}
          </section>

          <section>
            <SectionTitle title="유입 정보" description="현재 운영 기준: 홈페이지 / 현장 종이 신청서 / 직접 등록." />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="유입 경로">
                <select name="source_type" defaultValue="MANUAL" className={inputClass}>
                  {Object.entries(sourceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="유입 상세"><input name="source_detail" className={inputClass} placeholder="예: 제주 현장 / 홈페이지 신청" /></Field>
            </div>
          </section>

          <section>
            <SectionTitle title="상담 컨텍스트" description="기존 엑셀의 강의명·강의 참석일·안내지역·안내일정을 구조화합니다." />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="유입 강사"><input name="origin_instructor_name" className={inputClass} placeholder="예: 아이온" /></Field>
              <Field label="유입 강의명"><input name="origin_course_name" className={inputClass} placeholder="AI 활용 실무 과정" /></Field>
              <Field label="유입 강의 참석일"><input name="origin_attendance_date" type="date" className={inputClass} /></Field>
              <Field label="유입 지역"><input name="origin_region" className={inputClass} placeholder="제주" /></Field>
              <Field label="안내할 과정"><input name="offered_course_name" className={inputClass} placeholder="원데이 클래스" /></Field>
              <Field label="안내 지역"><input name="offered_region" className={inputClass} placeholder="서울 / 제주" /></Field>
              <Field label="안내 일정"><input name="offered_date" type="date" className={inputClass} /></Field>
            </div>
          </section>

          <section>
            <SectionTitle title="메모" description="고객 자체 특이사항만 적습니다. 상담 내용은 상담 기록에서 남깁니다." />
            <textarea name="memo" className={`${inputClass} mt-4 min-h-24 resize-y py-3`} placeholder="선택 사항" />
          </section>

          <input type="hidden" name="customer_type" value="LEAD" />
          {error ? <div className="rounded-[12px] border border-[#FF5C5C]/25 bg-[#FF5C5C]/8 p-3 text-sm text-[#FF7A7A]">{error}</div> : null}

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/8 bg-[#111318]/95 pt-4 backdrop-blur">
            <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
            <Button type="submit" disabled={Boolean(duplicate) || isPending}>{isPending ? "등록 중..." : "고객 등록"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-[#686F7D]">{description}</p></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[#A3A9B5]"><span>{label}</span><div className="mt-2">{children}</div>{error ? <span className="mt-1 block text-[11px] text-[#FF7A7A]">{error}</span> : null}</label>;
}

const inputClass = "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm text-[#F5F7FA] outline-none transition placeholder:text-[#484E59] focus:border-[#7C5CFF]";
