import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import StayCard from "@/components/StayCard";
import { getEvents, getStays, type EventItem, type StayItem } from "@/lib/api";

type DisplayStatus = "진행중" | "예정" | "마감";

const STATUS_COLORS: Record<DisplayStatus, string> = {
  진행중: "border-emerald-600 text-emerald-600",
  예정: "border-blue-600 text-blue-600",
  마감: "border-muted-foreground text-muted-foreground",
};

const TABS = ["전체", "진행중", "예정", "마감"] as const;

const getDisplayStatus = (e: EventItem): DisplayStatus => {
  const now = new Date();
  const start = new Date(e.start_date);
  const end = new Date(e.end_date);
  if (end < now) return "마감";
  if (start > now) return "예정";
  return "진행중";
};

const getRemainingLabel = (e: EventItem): string => {
  const now = new Date();
  const start = new Date(e.start_date);
  const end = new Date(e.end_date);
  if (end < now) return "마감됨";
  const target = start > now ? start : end;
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  return `D-${days}`;
};

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const target = new Date(targetDate).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const blocks = [
    { v: pad(h), l: "시간" },
    { v: pad(m), l: "분" },
    { v: pad(s), l: "초" },
  ];

  return (
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
  );
};

const Events = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]>("전체");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [popularStays, setPopularStays] = useState<StayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getEvents(), getStays({ limit: 4 })])
      .then(([evts, stays]) => {
        setEvents(evts);
        setPopularStays(stays);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const withStatus = events.map((e) => ({ ...e, displayStatus: getDisplayStatus(e) }));
  const filtered = tab === "전체" ? withStatus : withStatus.filter((e) => e.displayStatus === tab);
  const heroEvent = withStatus.find((e) => e.displayStatus === "진행중") ?? withStatus[0];

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="space-y-12">
      {/* Hero banner */}
      {heroEvent && (
        <section
          className="relative flex items-center justify-between overflow-hidden px-8 py-10 md:px-12"
          style={{ background: "#111111", height: "280px", borderRadius: "8px" }}
        >
          <div className="relative z-10 flex max-w-xl flex-col gap-3">
            <span
              className="w-fit px-2 py-1 text-[11px] text-white"
              style={{ border: "0.5px solid hsl(0 0% 100% / 0.5)", borderRadius: "4px" }}
            >
              {heroEvent.displayStatus}
            </span>
            <h2 className="font-serif-display text-3xl leading-tight text-white md:text-4xl">
              {heroEvent.title}
            </h2>
            <p className="text-sm text-white/60">
              {heroEvent.start_date} ~ {heroEvent.end_date}
              {heroEvent.max_discount ? ` · 최대 ${heroEvent.max_discount}% 할인` : ""}
            </p>
            <button
              onClick={() => navigate(`/events/${heroEvent.id}`)}
              className="mt-2 w-fit bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
              style={{ borderRadius: "4px" }}
            >
              지금 예약하기
            </button>
          </div>

          <div className="relative z-10 hidden md:block">
            <Countdown targetDate={`${heroEvent.end_date}T23:59:59`} />
          </div>

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />
        </section>
      )}

      {/* Filter tabs */}
      <section className="space-y-3">
        <div className="flex gap-2">
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground hover:border-foreground/60"
                )}
                style={{ borderRadius: "6px" }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">총 {events.length}개 이벤트</p>
      </section>

      {/* Event cards */}
      <section className="space-y-4">
        {filtered.map((e) => {
          const closed = e.displayStatus === "마감";
          return (
            <div
              key={e.id}
              className={cn("flex items-stretch gap-5 p-4", closed && "opacity-60")}
              style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
            >
              <div
                className="h-[120px] w-[120px] shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(0 0% 18%), hsl(0 0% 8%))",
                  borderRadius: "6px",
                }}
              />

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-1">
                <div className="space-y-1.5">
                  <span
                    className={cn("inline-block px-2 py-0.5 text-[11px]", STATUS_COLORS[e.displayStatus])}
                    style={{ border: "0.5px solid currentColor", borderRadius: "4px" }}
                  >
                    {e.displayStatus}
                  </span>
                  <h3 className="font-serif-display text-xl">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{e.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.start_date} ~ {e.end_date}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[e.type, e.region].filter(Boolean).map((t) => (
                    <span
                      key={t}
                      className="border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                      style={{ borderRadius: "4px" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex w-40 shrink-0 flex-col items-end justify-between py-1 text-right">
                <div className="font-serif-display text-lg text-foreground">
                  {e.max_discount ? `최대 ${e.max_discount}% 할인` : ""}
                </div>
                {e.displayStatus === "예정" ? (
                  <button
                    className="w-full border border-foreground/80 px-4 py-2 text-sm transition-colors hover:bg-foreground hover:text-background"
                    style={{ borderRadius: "4px" }}
                  >
                    알림 신청
                  </button>
                ) : closed ? (
                  <button
                    disabled
                    className="w-full cursor-not-allowed border border-border px-4 py-2 text-sm text-muted-foreground"
                    style={{ borderRadius: "4px" }}
                  >
                    종료된 이벤트
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/events/${e.id}`)}
                    className="w-full bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-90"
                    style={{ borderRadius: "4px" }}
                  >
                    참여하기
                  </button>
                )}
                <span className="text-xs text-muted-foreground">{getRemainingLabel(e)}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Popular event stays */}
      {popularStays.length > 0 && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif-display text-3xl">이벤트 인기 숙소</h2>
            <p className="text-sm text-muted-foreground">지금 가장 많이 예약되는 숙소</p>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {popularStays.map((s) => (
              <StayCard key={s.id} stay={s} imageHeight={180} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Events;
