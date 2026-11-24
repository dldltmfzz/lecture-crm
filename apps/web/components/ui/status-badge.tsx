import { cn } from "@/lib/utils";
const map={success:"text-[#48C78E] bg-[#48C78E]/10",warning:"text-[#FFB84D] bg-[#FFB84D]/10",danger:"text-[#FF5C5C] bg-[#FF5C5C]/10",info:"text-[#6EA8FE] bg-[#6EA8FE]/10",neutral:"text-[#A3A9B5] bg-white/5"};
export function StatusBadge({children,tone="neutral"}:{children:React.ReactNode;tone?:keyof typeof map}){return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",map[tone])}>{children}</span>}
