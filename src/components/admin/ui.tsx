import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export const AdminHeader = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="flex items-end justify-between mb-8">
    <h1 className="font-serif-display text-3xl">{title}</h1>
    {action}
  </div>
);

export const AdminCard = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("rounded-lg border border-white/8 bg-white/[0.02] p-5", className)} style={{ borderColor: "rgba(255,255,255,0.08)" }}>
    {children}
  </div>
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md";
};
export const AdminButton = ({ variant = "primary", size = "md", className, ...props }: BtnProps) => {
  const v = {
    primary: "bg-white text-[#0d0f14] hover:bg-white/90",
    outline: "border border-white/15 text-white hover:bg-white/5",
    danger: "border border-red-500/40 text-red-400 hover:bg-red-500/10",
    ghost: "text-white/60 hover:text-white hover:bg-white/5",
  }[variant];
  const s = size === "sm" ? "h-8 px-3 text-xs rounded-md" : "h-10 px-4 text-sm rounded-md";
  return <button className={cn("inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed", v, s, className)} {...props} />;
};

export const StatusBadge = ({ tone, children }: { tone: "green" | "blue" | "gray" | "red"; children: ReactNode }) => {
  const tones = {
    green: "border-green-500/40 text-green-400",
    blue: "border-blue-500/40 text-blue-400",
    gray: "border-white/15 text-white/50",
    red: "border-red-500/40 text-red-400",
  }[tone];
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[11px]", tones)}>{children}</span>;
};

export const AdminInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30",
      props.className,
    )}
  />
);

export const AdminTextarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "min-h-[80px] w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30",
      props.className,
    )}
  />
);

export const AdminSelect = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      "h-10 w-full rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-white/30",
      props.className,
    )}
  />
);

export const AdminLabel = ({ children }: { children: ReactNode }) => (
  <label className="block text-xs text-white/60 mb-1.5">{children}</label>
);

export const AdminTable = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
    <table className="w-full text-sm">{children}</table>
  </div>
);

export const Th = ({ children, className }: { children: ReactNode; className?: string }) => (
  <th className={cn("text-left text-[11px] uppercase tracking-wider text-white/40 font-medium px-4 py-3 border-b", className)} style={{ borderColor: "rgba(255,255,255,0.08)" }}>
    {children}
  </th>
);
export const Td = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={cn("px-4 py-3 border-b text-white/80", className)} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
    {children}
  </td>
);

// Modal
export const Modal = ({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-[#0d0f14]"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="font-serif-display text-xl text-white">{title}</h2>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
