import { ReactNode } from "react";

const features = [
  "전국 3,200개 이상의 숙소",
  "실시간 예약 확인",
  "안전한 결제 시스템",
];

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-2">
      {/* Left visual */}
      <div
        className="relative hidden flex-col items-center justify-center overflow-hidden p-10 text-white md:flex"
        style={{ background: "#111111" }}
      >
        <div className="relative z-10 flex max-w-sm flex-col items-center gap-6 text-center">
          <div className="font-serif-display text-5xl tracking-tight">Stays</div>
          <p className="text-sm text-white/60">특별한 순간을 위한 완벽한 숙소</p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/80">
            {features.map((f) => (
              <li key={f} className="flex items-center justify-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-white/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* faint grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 0.5px, transparent 0.5px), linear-gradient(to bottom, white 0.5px, transparent 0.5px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full" style={{ maxWidth: "380px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
