import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast as sonner } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getEvent, issueCoupon, ApiError, type EventDetail as EventDetailType } from "@/lib/api";
import KakaoMap from "@/components/KakaoMap";

const TARGET = new Date("2026-05-10T23:59:59").getTime();

const useCountdown = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, TARGET - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { d, h, m };
};

const FILTERS = ["전체", "호텔", "리조트", "펜션", "40%할인", "30%할인"] as const;
const SORTS = ["할인율순", "낮은가격순", "평점순"] as const;

const FAKE_NAMES = ["김민수", "이서연", "박지훈", "최유진", "정하늘", "강도윤"];

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { d, h, m } = useCountdown();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [eventData, setEventData] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState(247);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("할인율순");
  const [toast, setToast] = useState<string | null>(null);
  const [couponState, setCouponState] = useState<"idle" | "loading" | "success" | "already" | "soldout">("idle");

  // 이벤트 데이터 로드
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEvent(id)
      .then((data) => setEventData(data))
      .catch(() => sonner.error("이벤트를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const iv = setInterval(() => setViewers(200 + Math.floor(Math.random() * 100)), 3000);
    return () => clearInterval(iv);
  }, []);

  const eventStays = eventData?.stays || [];

  // 실시간 예약 알림 (UI 효과)
  useEffect(() => {
    if (!eventStays.length) return;
    let timeoutId: number;
    const schedule = () => {
      const wait = 5000 + Math.random() * 3000;
      timeoutId = window.setTimeout(() => {
        const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
        const stay = eventStays[Math.floor(Math.random() * eventStays.length)];
        const masked = name[0] + "○○";
        setToast(`${masked}님이 ${stay.name}을 방금 예약했습니다`);
        window.setTimeout(() => setToast(null), 3000);
        schedule();
      }, wait);
    };
    schedule();
    return () => window.clearTimeout(timeoutId);
  }, [eventStays]);

  const blocks = [
    { v: String(d).padStart(2, "0"), l: "일" },
    { v: String(h).padStart(2, "0"), l: "시간" },
    { v: String(m).padStart(2, "0"), l: "분" },
  ];

  const handleClaim = async () => {
    if (!isLoggedIn) {
      sonner.error("로그인이 필요한 서비스입니다");
      setTimeout(() => navigate("/login"), 600);
      return;
    }
    if (!eventData) return;

    setCouponState("loading");
    try {
      await issueCoupon({
        event_id: eventData.id,
        coupon_code: "SOLD-LOAD",
      });
      setCouponState("success");
      sonner.success("쿠폰이 발급되었습니다!");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message.includes("이미 발급")) {
          setCouponState("already");
        } else if (err.message.includes("소진")) {
          setCouponState("soldout");
        } else {
          sonner.error(err.message);
          setCouponState("idle");
        }
      }
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">로딩 중...</div>;
  }

  if (!eventData) {
    return <div className="py-20 text-center text-sm text-muted-foreground">이벤트를 찾을 수 없습니다</div>;
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section
        className="relative flex flex-col items-start justify-between gap-6 overflow-hidden px-8 py-10 md:flex-row md:items-center md:px-12"
        style={{ background: "#111111", minHeight: "320px", borderRadius: "8px" }}
      >
        <div className="flex max-w-xl flex-col gap-3">
          <span
            className="w-fit px-2 py-1 text-[11px] text-emerald-400"
            style={{ border: "0.5px solid hsl(160 60% 50%)", borderRadius: "4px" }}
          >
            {eventData.status === "active" ? "진행중" : "마감"}
          </span>
          <h1 className="font-serif-display text-3xl leading-tight text-white md:text-4xl">
            {eventData.title}
          </h1>
          <p className="text-sm text-white/60">
            {eventData.description}
          </p>
          <p className="text-sm text-white/60">{eventData.start_date} ~ {eventData.end_date}</p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="text-xs text-white/60">이벤트 종료까지</span>
          <div className="flex gap-3">
            {blocks.map((b) => (
              <div
                key={b.l}
                className="flex w-20 flex-col items-center justify-center py-3 text-white"
                style={{ border: "0.5px solid hsl(0 0% 100% / 0.3)", borderRadius: "6px" }}
              >
                <div className="font-serif-display text-3xl leading-none">{b.v}</div>
                <div className="mt-1 text-[11px] text-white/60">{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alert banner */}
      <div
        className="px-4 py-2.5 text-xs text-foreground"
        style={{ background: "#FEF3C7", borderRadius: "6px" }}
      >
        ⚡ 지금 {viewers}명이 이 페이지를 보고 있어요
      </div>

      {/* Stats bar */}
      <section
        className="grid grid-cols-3 divide-x divide-border"
        style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
      >
        {[
          { l: "참여 숙소", v: `${eventStays.length}개` },
          { l: "최대 할인", v: `${eventData.max_discount || 40}%` },
          { l: "남은 객실", v: `${eventData.remaining_rooms}개` },
        ].map((s) => (
          <div key={s.l} className="flex flex-col items-center justify-center px-4 py-5">
            <span className="text-xs text-muted-foreground">{s.l}</span>
            <span className="font-serif-display text-2xl text-foreground">{s.v}</span>
          </div>
        ))}
      </section>

      {/* Coupon section */}
      <section
        className="flex flex-col items-start justify-between gap-4 px-6 py-6 md:flex-row md:items-center"
        style={{ border: "0.5px dashed hsl(0 0% 60%)", borderRadius: "8px" }}
      >
        <div className="space-y-1">
          <div className="font-serif-display text-2xl">30% 할인 쿠폰</div>
          <div className="text-xs text-muted-foreground">
            코드 <span className="font-mono">SOLD-LOAD</span> · 2026.05.31까지
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button
            onClick={handleClaim}
            disabled={couponState === "already" || couponState === "soldout" || couponState === "loading"}
            className={cn(
              "px-5 py-2.5 text-sm transition-opacity",
              couponState === "already" || couponState === "soldout"
                ? "bg-muted text-muted-foreground"
                : "bg-foreground text-background hover:opacity-90",
            )}
            style={{ borderRadius: "4px" }}
          >
            {couponState === "loading" ? "발급 중..." : "쿠폰 받기"}
          </button>
          {couponState === "success" && (
            <span className="text-xs" style={{ color: "hsl(150 60% 35%)" }}>
              SOLD-LOAD 발급 완료 ✓
            </span>
          )}
          {couponState === "already" && (
            <span className="text-xs text-muted-foreground">이미 발급받은 쿠폰입니다</span>
          )}
          {couponState === "soldout" && (
            <span className="text-xs" style={{ color: "hsl(0 70% 50%)" }}>
              쿠폰이 모두 소진됐습니다 😢
            </span>
          )}
        </div>
      </section>

      {/* Filter */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif-display text-3xl">이벤트 참여 숙소</h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            className="border border-border bg-background px-3 py-2 text-sm"
            style={{ borderRadius: "6px" }}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground hover:border-foreground/60"
                )}
                style={{ borderRadius: "6px" }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </section>

      {/* Cards grid */}
      <section className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {eventStays.map((s) => {
          const discounted = Math.round((s.price * (100 - s.discount_rate)) / 100);
          return (
            <div
              key={s.stay_id}
              className="group flex flex-col gap-3 transition-transform duration-200 hover:scale-[1.02]"
            >
              <div
                className="relative overflow-hidden"
                style={{ borderRadius: "8px" }}
              >
                <div
                  className="w-full"
                  style={{
                    background: s.image_url
                      ? `url(${s.image_url}) center/cover`
                      : "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
                    height: "200px",
                  }}
                />
                <span
                  className="absolute left-3 top-3 px-2 py-1 text-[12px] font-bold text-white"
                  style={{ background: "hsl(0 75% 50%)", borderRadius: "4px" }}
                >
                  -{s.discount_rate}%
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    ₩{s.price.toLocaleString()}
                  </span>
                </div>
                <div className="text-lg font-medium text-foreground">
                  ₩{discounted.toLocaleString()}
                  <span className="text-xs text-muted-foreground"> / 1박</span>
                </div>
                <h3 className="text-[15px] font-medium text-foreground">{s.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{s.location}</span>
                  <span>·</span>
                  <span>★ {s.rating}</span>
                </div>
                <div className="text-xs" style={{ color: "hsl(0 75% 50%)" }}>
                  객실 {s.remaining_rooms}개 남음
                </div>
              </div>

              <button
                onClick={() => navigate(`/stays/${s.stay_id}?event_id=${id}&coupon=SOLD-LOAD`)}
                className="w-full bg-foreground py-2.5 text-sm text-background transition-opacity hover:opacity-90"
                style={{ borderRadius: "4px" }}
              >
                지금 예약하기
              </button>
            </div>
          );
        })}
      </section>

      {/* 솔데스크 지점 찾기 */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-serif-display text-3xl">솔데스크 지점 찾기</h2>
          <p className="text-sm text-muted-foreground">이벤트 참여 지점 위치를 확인하세요</p>
        </div>
        <KakaoMap
          center={{ lat: 37.5200, lng: 127.0050 }}
          level={8}
          height={400}
          markers={[
            {
              id: "jongno",
              lat: 37.5704,
              lng: 126.9831,
              label: "솔데스크 종로점",
              info: "솔데스크 종로점 · 종로구 종로12길 15<br/><b>클릭하여 상세보기</b>",
              onClick: () => navigate("/stays/dd01ddae-11b8-44ec-8ddd-841e0d81ee1d"),
            },
            {
              id: "pavilion",
              lat: 37.4981,
              lng: 127.0280,
              label: "솔데스크 강남파빌리온점",
              info: "솔데스크 강남파빌리온점 · 강남구 강남대로98길 16<br/><b>클릭하여 상세보기</b>",
              onClick: () => navigate("/stays/86eb76c6-edb7-49b1-8c55-ac6236b66957"),
            },
            {
              id: "seongok",
              lat: 37.5131,
              lng: 127.0572,
              label: "솔데스크 강남성옥빌딩점",
              info: "솔데스크 강남성옥빌딩점 · 강남구 봉은사로 119<br/><b>클릭하여 상세보기</b>",
              onClick: () => navigate("/stays/d83e5082-a03d-4e1c-918a-37d17b0d8995"),
            },
          ]}
        />
      </section>

      {/* Bottom CTA */}
      <section
        className="flex flex-col items-center gap-3 px-8 py-14 text-center"
        style={{ background: "#111111", borderRadius: "8px" }}
      >
        <h2 className="font-serif-display text-4xl text-white">놓치면 후회해요</h2>
        <p className="text-sm text-white/60">
          지금 예약하지 않으면 이 가격은 다시 없어요
        </p>
        <button
          onClick={() => navigate("/stays")}
          className="mt-3 bg-white px-6 py-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
          style={{ borderRadius: "4px" }}
        >
          전체 이벤트 숙소 보기
        </button>
      </section>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-xs animate-fade-in px-4 py-3 text-xs text-white shadow-lg"
          style={{ background: "#111111", borderRadius: "6px" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default EventDetail;
