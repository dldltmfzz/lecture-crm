"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@aileaders/domain";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordConsultationAction } from "@/features/customers/actions";
import { contactResultLabels, contactTypeLabels, priorityLabels } from "@/features/customers/constants";

export function ConsultationModal({
  open,
  customerId,
  leads,
  onClose,
  onSaved,
}: {
  open: boolean;
  customerId: string;
  leads: Lead[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [followUp, setFollowUp] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  if (!open) return null;

  function submit(formData: FormData) {
    setError("");
    const raw = Object.fromEntries(formData.entries());
    const payload = { ...raw, follow_up_required: followUp };
    startTransition(async () => {
      const result = await recordConsultationAction(payload);
      if (!result.ok) { setError(result.error); return; }
      onSaved();
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-6" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] border border-white/10 bg-[#171A20] p-5 shadow-2xl md:max-w-[560px] md:rounded-[20px] md:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div><div className="text-[11px] font-semibold tracking-[.18em] text-[#7C5CFF]">CONTACT LOG</div><h2 className="mt-1 text-lg font-semibold">상담 기록</h2></div>
          <button aria-label="닫기" onClick={onClose} className="rounded-lg p-2 text-[#686F7D] hover:bg-white/5"><X size={18} /></button>
        </div>

        <form action={submit} className="mt-6 space-y-4">
          <input type="hidden" name="customer_id" value={customerId} />
          <Field label="상담 대상">
            <select name="lead_id" defaultValue={leads[0]?.id ?? ""} className={inputClass}>
              {leads.length === 0 ? <option value="">일반 상담</option> : leads.map((lead) => <option value={lead.id} key={lead.id}>{lead.offered_course_name || lead.offered_region || "상담 리드"}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="연락 방식"><select name="contact_type" defaultValue="CALL" className={inputClass}>{Object.entries(contactTypeLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="결과"><select name="result" defaultValue="CONNECTED" className={inputClass}>{Object.entries(contactResultLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          </div>
          <Field label="상담 메모"><textarea name="note" className={`${inputClass} min-h-28 resize-y py-3`} placeholder="예: 남편과 상의 후 금요일 재연락 요청" /></Field>

          <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-white/8 bg-[#111318] p-4">
            <div><div className="text-sm font-medium">다음 연락 필요</div><div className="mt-1 text-xs text-[#686F7D]">기존 엑셀의 ‘재연락’ 메모 대신 날짜로 관리합니다.</div></div>
            <input type="checkbox" checked={followUp} onChange={(event) => setFollowUp(event.target.checked)} className="h-4 w-4 accent-[#7C5CFF]" />
          </label>

          {followUp ? <div className="grid gap-3 rounded-[14px] border border-[#7C5CFF]/20 bg-[#7C5CFF]/5 p-4 sm:grid-cols-2">
            <Field label="다음 연락일 *"><input name="follow_up_at" type="datetime-local" required className={inputClass} /></Field>
            <Field label="우선순위"><select name="follow_up_priority" defaultValue="NORMAL" className={inputClass}>{Object.entries(priorityLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field label="재연락 사유"><input name="follow_up_reason" className={inputClass} placeholder="예: 입금 확인 / 배우자와 상의 후 연락" /></Field></div>
          </div> : <input type="hidden" name="follow_up_priority" value="NORMAL" />}

          {error ? <div className="rounded-[12px] border border-[#FF5C5C]/25 bg-[#FF5C5C]/8 p-3 text-sm text-[#FF7A7A]">{error}</div> : null}
          <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>취소</Button><Button type="submit" disabled={isPending}>{isPending ? "저장 중..." : "상담 저장"}</Button></div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-[#A3A9B5]"><span>{label}</span><div className="mt-2">{children}</div></label>;
}
const inputClass = "h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 text-sm text-[#F5F7FA] outline-none transition placeholder:text-[#484E59] focus:border-[#7C5CFF]";
