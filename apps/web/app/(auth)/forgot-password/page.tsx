"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    setPending(false);
    setMessage(error ? "재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요." : "비밀번호 재설정 메일을 보냈습니다. 받은편지함과 스팸함을 확인해주세요.");
  }

  return <section className="w-full max-w-[420px] rounded-[20px] border border-white/8 bg-[#111318]/90 p-7 shadow-2xl">
    <div className="text-xl font-semibold">AILeaders</div>
    <h1 className="mt-10 text-2xl font-semibold">비밀번호 재설정</h1>
    <p className="mt-2 text-sm leading-6 text-[#A3A9B5]">가입한 이메일로 안전한 재설정 링크를 보내드립니다.</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-xs text-[#A3A9B5]">Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-2 h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 outline-none focus:border-[#7C5CFF]" />
      </label>
      <Button disabled={pending} className="w-full">{pending ? "전송 중..." : "재설정 메일 보내기"}</Button>
    </form>
    {message ? <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-[#A3A9B5]">{message}</p> : null}
    <div className="mt-6 text-center"><Link href="/login" className="text-xs text-[#A996FF]">로그인으로 돌아가기</Link></div>
  </section>;
}
