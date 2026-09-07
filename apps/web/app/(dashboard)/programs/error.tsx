"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <div className="rounded-2xl border border-[#FF5C5C]/20 bg-[#FF5C5C]/5 p-8"><h2 className="text-lg font-semibold">강의 데이터를 불러오지 못했습니다.</h2><p className="mt-2 text-sm text-[#A3A9B5]">잠시 후 다시 시도해주세요.</p><Button className="mt-5" variant="secondary" onClick={reset}>다시 시도</Button></div>}
