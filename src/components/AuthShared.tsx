import { cn } from "@/lib/utils";

export const SocialButtons = () => {
  const base =
    "flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90";
  const radius = { borderRadius: "4px" } as const;

  return (
    <div className="space-y-2">
      <button
        className={base}
        style={{ ...radius, background: "#FEE500", color: "#111111" }}
      >
        카카오로 계속하기
      </button>
      <button
        className={base}
        style={{ ...radius, background: "#03C75A", color: "#ffffff" }}
      >
        네이버로 계속하기
      </button>
      <button
        className={cn(base, "border border-border bg-background text-foreground hover:bg-muted")}
        style={radius}
      >
        구글로 계속하기
      </button>
    </div>
  );
};

export const Divider = () => (
  <div className="flex items-center gap-3 py-1">
    <div className="h-px flex-1 bg-border" />
    <span className="text-xs text-muted-foreground">또는</span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

export const fieldClass = (state: "idle" | "error" | "success") =>
  cn(
    "w-full bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground",
    state === "error"
      ? "border border-destructive focus:border-destructive"
      : state === "success"
      ? "border border-emerald-500/70"
      : "border border-border"
  );
