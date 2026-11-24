"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="flex min-h-[60vh] items-center justify-center"><div className="max-w-md rounded-[18px] border border-[#FF5C5C]/20 bg-[#111318] p-7 text-center"><AlertTriangle className="mx-auto text-[#FF5C5C]"/><h2 className="mt-4 text-lg font-semibold">CRM 데이터를 불러오지 못했습니다.</h2><p className="mt-2 text-sm leading-6 text-[#686F7D]">Supabase 연결과 Sprint 02 마이그레이션 적용 여부를 확인해주세요.</p><Button variant="secondary" className="mt-5" onClick={reset}><RotateCcw size={15} className="mr-2"/>다시 시도</Button></div></div>;
}
