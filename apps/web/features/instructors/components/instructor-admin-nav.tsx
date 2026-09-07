import Link from "next/link";
import { CalendarDays, Presentation, Rows3 } from "lucide-react";
const tabs=[{href:"/instructors",label:"강사 전체",icon:Presentation},{href:"/instructors/free-class-board",label:"무료강의 일정",icon:CalendarDays},{href:"/instructors/availability",label:"가능 일정",icon:Rows3}];
export function InstructorAdminNav(){return <nav className="flex gap-2 overflow-x-auto">{tabs.map(({href,label,icon:Icon})=><Link key={href} href={href} className="flex whitespace-nowrap items-center gap-2 rounded-full border border-white/8 bg-[#0D0F13] px-3.5 py-2 text-xs text-[#A3A9B5] hover:bg-white/5 hover:text-white"><Icon size={14}/>{label}</Link>)}</nav>}
