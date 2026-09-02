import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
