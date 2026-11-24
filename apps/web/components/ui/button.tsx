import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const styles=cva("inline-flex items-center justify-center rounded-[10px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none h-11 px-4 text-sm",{variants:{variant:{primary:"bg-[#F5F7FA] text-[#08090C] hover:bg-white",secondary:"bg-[#171A20] border border-white/10 hover:bg-[#1D2027]",ghost:"hover:bg-white/5",ai:"bg-[#7C5CFF] text-white hover:bg-[#8B70FF]",danger:"border border-[#FF5C5C]/40 text-[#FF7A7A] hover:bg-[#FF5C5C]/10"}},defaultVariants:{variant:"primary"}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof styles>{}
export function Button({className,variant,...props}:ButtonProps){return <button className={cn(styles({variant}),className)} {...props}/>;}
