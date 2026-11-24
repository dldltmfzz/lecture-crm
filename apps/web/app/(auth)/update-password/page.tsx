"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("재설정 링크를 확인하고 있습니다...");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setReady(true);
        setMessage("");
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        setMessage("");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("입력한 비밀번호가 서로 다릅니다.");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPending(false);
      setMessage("비밀번호를 변경하지 못했습니다. 재설정 링크를 다시 요청해주세요.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=success");
  }

  return <section className="w-full max-w-[420px] rounded-[20px] border border-white/8 bg-[#111318]/90 p-7 shadow-2xl">
    <div className="text-xl font-semibold">AILeaders</div>
    <h1 className="mt-10 text-2xl font-semibold">새 비밀번호 설정</h1>
    <p className="mt-2 text-sm text-[#A3A9B5]">8자 이상의 새 비밀번호를 입력해주세요.</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-xs text-[#A3A9B5]">새 비밀번호
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required disabled={!ready} className="mt-2 h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 outline-none focus:border-[#7C5CFF] disabled:opacity-50" />
      </label>
      <label className="block text-xs text-[#A3A9B5]">새 비밀번호 확인
        <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" minLength={8} required disabled={!ready} className="mt-2 h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 outline-none focus:border-[#7C5CFF] disabled:opacity-50" />
      </label>
      <Button disabled={!ready || pending} className="w-full">{pending ? "변경 중..." : "비밀번호 변경"}</Button>
    </form>
    {message ? <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-[#A3A9B5]">{message}</p> : null}
  </section>;
}
