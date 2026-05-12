import { useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Wifi,
  UtensilsCrossed,
  Waves,
  Car,
  Coffee,
  Snowflake,
  Star,
  Calendar as CalendarIcon,
  Users,
  Images,
  Minus,
  Plus,
  MapPin,
} from "lucide-react";
import { STAYS } from "@/data/stays";
import KakaoMap from "@/components/KakaoMap";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const AMENITIES = [
  { icon: Wifi, label: "와이파이" },
  { icon: UtensilsCrossed, label: "주방" },
  { icon: Waves, label: "수영장" },
  { icon: Car, label: "주차" },
  { icon: Coffee, label: "조식포함" },
  { icon: Snowflake, label: "에어컨" },
];

const REVIEWS = [
  {
    name: "지현",
    date: "2026년 4월",
    rating: 5,
    text: "정말 깨끗하고 뷰가 환상적이에요. 호스트 분도 친절하시고 다음에 또 방문하고 싶은 숙소입니다.",
  },
  {
    name: "민호",
    date: "2026년 3월",
    rating: 5,
    text: "조식이 정말 맛있었고 위치도 최고였습니다. 가족 여행으로 정말 만족스러운 시간이었어요.",
  },
  {
    name: "수빈",
    date: "2026년 3월",
    rating: 4,
    text: "사진과 동일한 분위기. 침구 상태가 좋고 주변이 조용해서 푹 쉬다 갈 수 있었습니다.",
  },
  {
    name: "재훈",
    date: "2026년 2월",
    rating: 5,
    text: "프라이빗한 공간에서 보낸 시간이 너무 행복했어요. 시설도 새것 같고 청결도 만점입니다.",
  },
];

const StayDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event_id");
  const couponParam = searchParams.get("coupon");
  const stay = STAYS.find((s) => s.id === id) ?? STAYS[0];
  const [bannerOpen, setBannerOpen] = useState(true);

  const hasEvent = Boolean(eventId);
  const discountPct = hasEvent ? 30 : 0;
  const couponCode = couponParam || (hasEvent ? "SOLD-2026" : "");
  const discountedNightly = hasEvent
    ? Math.round((stay.price * (100 - discountPct)) / 100)
    : stay.price;

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 3;
    const ms = checkOut.getTime() - checkIn.getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [checkIn, checkOut]);

  const subtotal = discountedNightly * nights;
  const cleaning = 30000;
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + cleaning + service;

  const bookingHref = hasEvent
    ? `/booking?event_id=${encodeURIComponent(eventId!)}&coupon=${encodeURIComponent(couponCode)}&stay_id=${stay.id}`
    : "/booking";

  return (
    <div className="space-y-10">
      {hasEvent && bannerOpen && (
        <div
          className="-mx-4 flex h-12 items-center justify-between px-6 md:-mx-8"
          style={{ background: "#111111" }}
        >
          <span className="text-xs text-background md:text-sm">
            🎉 솔데스크 오픈 기념 특가 적용중 · 쿠폰 자동 적용됨
          </span>
          <button
            onClick={() => setBannerOpen(false)}
            className="text-background/60 hover:text-background"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Breadcrumb / title */}
      <div className="space-y-2">
        <Link to="/stays" className="text-xs text-muted-foreground hover:text-foreground">
          ← 숙소 목록으로
        </Link>
      </div>

      {/* Image gallery */}
      <section className="grid h-[480px] grid-cols-1 gap-2 md:grid-cols-5">
        <div
          className="relative md:col-span-3"
          style={{ background: stay.image, borderRadius: "8px" }}
        />
        <div className="hidden gap-2 md:col-span-2 md:grid md:grid-rows-2">
          <div
            style={{
              background: "linear-gradient(135deg, hsl(40 30% 75%), hsl(30 35% 55%))",
              borderRadius: "8px",
            }}
          />
          <div className="relative" style={{
              background: "linear-gradient(135deg, hsl(220 25% 75%), hsl(230 30% 50%))",
              borderRadius: "8px",
            }}>
            <button
              className="absolute bottom-3 right-3 flex items-center gap-2 border border-foreground/80 bg-background px-3 py-1.5 text-xs text-foreground hover:bg-foreground hover:text-background"
              style={{ borderRadius: "6px" }}
            >
              <Images className="h-3.5 w-3.5" />
              사진 모두 보기
            </button>
          </div>
        </div>
      </section>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-8">
          <header className="space-y-3">
            <h1 className="font-serif-display text-4xl leading-tight">{stay.name}</h1>
            <div className="text-sm text-muted-foreground">
              {stay.location} · 최대 4명 · 침실 2 · 욕실 2
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-foreground" />
              <span className="font-medium">{stay.rating}</span>
              <span className="text-muted-foreground">· 후기 {stay.reviews}개</span>
            </div>
          </header>

          <Divider />

          {/* Host */}
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(20 40% 70%), hsl(10 50% 45%))",
                borderRadius: "9999px",
              }}
            />
            <div>
              <div className="text-sm font-medium">호스트: 김민준</div>
              <div className="text-xs text-muted-foreground">Stays 호스트 3년</div>
            </div>
          </div>

          <Divider />

          {/* Amenities */}
          <section className="space-y-4">
            <h2 className="font-serif-display text-xl">편의시설</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {AMENITIES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <Icon className="h-4 w-4 text-foreground" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* Description */}
          <section className="space-y-3">
            <h2 className="font-serif-display text-xl">숙소 소개</h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              자연과 어우러진 프라이빗한 공간에서 특별한 휴식을 경험하세요. 통창으로 들어오는 햇살과 탁
              트인 전망이 일상의 피로를 잊게 합니다. 가족, 연인, 친구와 함께 잊지 못할 추억을 만들어
              보시길 바랍니다.
            </p>
          </section>

          <Divider />

          {/* Location */}
          <section className="space-y-4">
            <h2 className="font-serif-display text-xl">위치</h2>
            <KakaoMap
              center={stay.coords ?? { lat: 33.38, lng: 126.55 }}
              level={5}
              height={300}
              markers={
                stay.coords
                  ? [
                      {
                        id: stay.id,
                        lat: stay.coords.lat,
                        lng: stay.coords.lng,
                        label: stay.name,
                        info: stay.name,
                      },
                    ]
                  : []
              }
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {stay.address ?? `${stay.location} 일주서로 1234`}
            </div>
          </section>

          <Divider />

          {/* Reviews */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif-display text-xl">후기 {stay.reviews}개</h2>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-foreground" />
                <span className="font-medium">{stay.rating}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {REVIEWS.map((r) => (
                <div key={r.name} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9"
                      style={{
                        background: `linear-gradient(135deg, hsl(${
                          r.name.charCodeAt(0) * 7 % 360
                        } 30% 70%), hsl(${(r.name.charCodeAt(0) * 11) % 360} 40% 45%))`,
                        borderRadius: "9999px",
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-foreground" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">{r.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT — booking card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="space-y-5 bg-background p-6"
            style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
          >
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  {hasEvent && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₩{stay.price.toLocaleString()}
                    </span>
                  )}
                  <span className="font-serif-display text-3xl">
                    ₩{discountedNightly.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 박</span>
                  {hasEvent && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-medium text-background"
                      style={{ background: "hsl(0 70% 50%)", borderRadius: "4px" }}
                    >
                      -{discountPct}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-foreground" />
                  <span className="font-medium">{stay.rating}</span>
                  <span className="text-muted-foreground">({stay.reviews})</span>
                </div>
              </div>
              {hasEvent && (
                <div className="text-xs" style={{ color: "hsl(150 60% 35%)" }}>
                  {couponCode} 적용됨 ✓
                </div>
              )}
            </div>

            <div style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "6px" }}>
              <div className="grid grid-cols-2">
                <DateField label="체크인" value={checkIn} onChange={setCheckIn} />
                <div style={{ borderLeft: "0.5px solid hsl(0 0% 88%)" }}>
                  <DateField label="체크아웃" value={checkOut} onChange={setCheckOut} />
                </div>
              </div>
              <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }}>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-left">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          인원
                        </span>
                        <span className="text-sm">게스트 {guests}명</span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4" align="start">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">게스트</div>
                        <div className="text-xs text-muted-foreground">최대 4명</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="flex h-8 w-8 items-center justify-center border border-foreground/30 disabled:opacity-30"
                          style={{ borderRadius: "4px" }}
                          disabled={guests <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{guests}</span>
                        <button
                          onClick={() => setGuests(Math.min(4, guests + 1))}
                          className="flex h-8 w-8 items-center justify-center border border-foreground/30 disabled:opacity-30"
                          style={{ borderRadius: "4px" }}
                          disabled={guests >= 4}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Link
              to={bookingHref}
              className="block bg-foreground py-3 text-center text-sm text-background transition-opacity hover:opacity-90"
              style={{ borderRadius: "6px" }}
            >
              {hasEvent ? "지금 예약하기" : "예약하기"}
            </Link>

            <div className="space-y-2 text-sm">
              <Row label={`₩${discountedNightly.toLocaleString()} × ${nights}박`} value={`₩${subtotal.toLocaleString()}`} />
              <Row label="청소비" value={`₩${cleaning.toLocaleString()}`} />
              <Row label="서비스 수수료" value={`₩${service.toLocaleString()}`} />
              <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} className="pt-3">
                <Row label="총 합계" value={`₩${total.toLocaleString()}`} bold />
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              아직 요금이 청구되지 않습니다
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Divider = () => <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} />;

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={cn("flex items-center justify-between", bold && "font-medium")}>
    <span className={bold ? "text-foreground" : "text-foreground/80"}>{label}</span>
    <span>{value}</span>
  </div>
);

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (d: Date | undefined) => void;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className={cn("text-sm", !value && "text-muted-foreground")}>
            {value ? format(value, "MM.dd (E)", { locale: ko }) : "날짜 추가"}
          </span>
        </div>
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
    </PopoverContent>
  </Popover>
);

export default StayDetail;
