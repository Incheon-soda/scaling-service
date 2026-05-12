import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getMyCoupons, type CouponResult } from "@/lib/api";

const TABS = ["전체", "사용가능", "사용완료"] as const;

const Coupons = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]>("전체");
  const [coupons, setCoupons] = useState<CouponResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCoupons()
      .then(setCoupons)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    active: coupons.filter((c) => !c.is_used).length,
    used: coupons.filter((c) => c.is_used).length,
  }), [coupons]);

  const filtered = useMemo(() => {
    if (tab === "사용가능") return coupons.filter((c) => !c.is_used);
    if (tab === "사용완료") return coupons.filter((c) => c.is_used);
    return coupons;
  }, [coupons, tab]);

  return (
    <div className="space-y-8">
      <h1 className="font-serif-display text-3xl">내 쿠폰</h1>

      <div
        className="grid grid-cols-2 divide-x divide-border"
        style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
      >
        {[
          { l: "사용가능", v: stats.active },
          { l: "사용완료", v: stats.used },
        ].map((s) => (
          <div key={s.l} className="flex flex-col items-center px-4 py-5">
            <span className="text-xs text-muted-foreground">{s.l}</span>
            <span className="font-serif-display text-2xl">{s.v}개</span>
          </div>
        ))}
      </div>

      <div className="flex gap-6" style={{ borderBottom: "0.5px solid hsl(0 0% 85%)" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm transition-colors",
              tab === t
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {tab === "전체" ? "발급받은 쿠폰이 없습니다." : "해당 쿠폰이 없습니다."}
          </div>
        ) : (
          filtered.map((c) => (
            <CouponCard
              key={c.id}
              coupon={c}
              onUse={() => navigate(`/booking?coupon=${c.code}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CouponCard = ({ coupon, onUse }: { coupon: CouponResult; onUse: () => void }) => {
  const muted = coupon.is_used;
  return (
    <div
      className={cn(
        "relative flex items-stretch overflow-hidden bg-background",
        muted && "opacity-60",
      )}
      style={{ border: "1px dashed hsl(0 0% 50%)", borderRadius: "8px" }}
    >
      <div
        className="flex w-32 shrink-0 flex-col items-center justify-center px-4 py-6 text-background"
        style={{ background: muted ? "hsl(0 0% 60%)" : "hsl(0 0% 13%)" }}
      >
        <div className="font-serif-display text-3xl leading-none">{coupon.discount_rate}%</div>
        <div className="mt-1 text-xs">할인</div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {coupon.discount_rate}% 할인 쿠폰
          </span>
          {coupon.is_used && <Badge label="사용완료" />}
        </div>
        <div className="font-mono text-xs text-muted-foreground">{coupon.code}</div>
        <div className="text-xs text-muted-foreground">
          잔여 {coupon.remaining_count} / 전체 {coupon.total_count}
        </div>
      </div>

      <div className="flex w-36 shrink-0 items-center justify-center px-4">
        {!coupon.is_used && (
          <button
            onClick={onUse}
            className="w-full bg-foreground py-2.5 text-sm text-background transition-opacity hover:opacity-90"
            style={{ borderRadius: "4px" }}
          >
            사용하기
          </button>
        )}
      </div>

      {coupon.is_used && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span
            className="font-serif-display text-7xl tracking-widest"
            style={{ color: "hsl(0 0% 0% / 0.06)", transform: "rotate(-20deg)" }}
          >
            USED
          </span>
        </div>
      )}
    </div>
  );
};

const Badge = ({ label }: { label: string }) => (
  <span
    className="px-2 py-0.5 text-[10px] text-muted-foreground"
    style={{ border: "0.5px solid hsl(0 0% 75%)", borderRadius: "4px" }}
  >
    {label}
  </span>
);

export default Coupons;
