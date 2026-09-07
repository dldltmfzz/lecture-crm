import Link from "next/link";
import { loginAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;

  return <section className="w-full max-w-[420px] rounded-[20px] border border-white/8 bg-[#111318]/90 p-7 shadow-2xl">
    <div className="text-xl font-semibold">AILeaders</div>
    <div className="mt-1 text-[10px] tracking-[.22em] text-[#686F7D]">OPERATING SYSTEM</div>
    <h1 className="mt-10 text-2xl font-semibold">로그인</h1>
    <p className="mt-2 text-sm text-[#A3A9B5]">승인된 AILeaders 계정으로 접속하세요.</p>
    {query.error ? <p className="mt-4 text-sm text-[#FF7A7A]">로그인 정보를 확인해주세요.</p> : null}
    {query.reset === "success" ? <p className="mt-4 text-sm text-[#48C78E]">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.</p> : null}
    <form action={loginAction} className="mt-7 space-y-4">
      <label className="block text-xs text-[#A3A9B5]">Email<input name="email" type="email" required className="mt-2 h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 outline-none focus:border-[#7C5CFF]" /></label>
      <label className="block text-xs text-[#A3A9B5]">Password<input name="password" type="password" required className="mt-2 h-11 w-full rounded-[10px] border border-white/10 bg-[#0D0F13] px-3 outline-none focus:border-[#7C5CFF]" /></label>
      <div className="text-right"><Link href="/forgot-password" className="text-xs text-[#A996FF]">비밀번호를 잊으셨나요?</Link></div>
      <Button className="w-full">LOGIN</Button>
    </form>
    <p className="mt-6 text-center text-sm text-[#686F7D]">계정이 없나요? <Link href="/signup" className="text-[#A996FF]">Create account</Link></p>
    <div className="mt-4 text-center"><Link href="/instructor-login" className="text-xs text-[#A996FF]">강사 전용 로그인</Link></div>
  </section>;
}
