import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function DashboardCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-white/10 bg-panel/90 p-6 shadow-glow backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}
