import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { X, Star, MapPin, Users, Calendar as CalendarIcon, Minus, Plus, Wifi, UtensilsCrossed, Waves, Car, Coffee, Snowflake } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import KakaoMap from "@/components/KakaoMap";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getStay, getStayReviews, type StayDetail as StayDetailType, type ReviewItem } from "@/lib/api";

const AMENITY_ICONS: Record<string, React.ElementType> = {
  "와이파이": Wifi,
  "주방": UtensilsCrossed,
  "수영장": Waves,
  "주차": Car,
  "조식포함": Coffee,
  "에어컨": Snowflake,
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
  "linear-gradient(135deg, hsl(150 30% 65%), hsl(160 40% 45%))",
  "linear-gradient(135deg, hsl(30 40% 70%), hsl(20 50% 55%))",
  "linear-gradient(135deg, hsl(270 30% 70%), hsl(280 40% 50%))",
];

const StayDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event_id");
  const couponParam = searchParams.get("coupon");

  const [stay, setStay] = useState<StayDetailType | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getStay(id), getStayReviews(id, 8)])
      .then(([s, r]) => { setStay(s); setReviews(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const hasEvent = Boolean(eventId);
  const discountPct = hasEvent ? 30 : 0;
  const couponCode = couponParam || (hasEvent ? "SOLD-LOAD" : "");

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
  }, [checkIn, checkOut]);

  if (loading) return <div className="py-20 text-center text-sm text-muted-foreground">로딩 중...</div>;
  if (!stay) return <div className="py-20 text-center text-sm text-muted-foreground">숙소를 찾을 수 없습니다</div>;

  const idHash = stay.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const mainBg = stay.image_url
    ? `url(${stay.image_url}) center/cover no-repeat`
    : FALLBACK_GRADIENTS[idHash % FALLBACK_GRADIENTS.length];

  const price = stay.price;
  const discountedPrice = hasEvent ? Math.round(price * (100 - discountPct) / 100) : price;
  const subtotal = discountedPrice * nights;
  const cleaning = 30000;
  const service = Math.round(subtotal * 0.05);
  const total = subtotal + cleaning + service;

  const bookingHref = hasEvent
    ? `/booking?stay_id=${stay.id}&event_id=${encodeURIComponent(eventId!)}&coupon=${encodeURIComponent(couponCode)}`
    : `/booking?stay_id=${stay.id}`;

  return (
    <div className="space-y-10">
      {hasEvent && bannerOpen && (
        <div className="-mx-4 flex h-12 items-center justify-between px-6 md:-mx-8" style={{ background: "#111111" }}>
          <span className="text-xs text-background md:text-sm">
            🎉 솔데스크 오픈 기념 특가 적용중 · 쿠폰 자동 적용됨
          </span>
          <button onClick={() => setBannerOpen(false)} className="text-background/60 hover:text-background">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <Link to="/stays" className="text-xs text-muted-foreground hover:text-foreground">← 숙소 목록으로</Link>
      </div>

      {/* 이미지 갤러리 */}
      <section className="grid h-[480px] grid-cols-1 gap-2 md:grid-cols-5">
        <div className="relative md:col-span-3" style={{ background: mainBg, borderRadius: "8px" }} />
        <div className="hidden gap-2 md:col-span-2 md:grid md:grid-rows-2">
          {stay.images.slice(1, 3).map((img, i) => (
            <div key={i} style={{ background: `url(${img}) center/cover no-repeat`, borderRadius: "8px" }} />
          ))}
          {stay.images.length < 2 && Array.from({ length: 2 - stay.images.length }).map((_, i) => (
            <div key={`fb-${i}`} style={{ background: FALLBACK_GRADIENTS[(idHash + i + 1) % FALLBACK_GRADIENTS.length], borderRadius: "8px" }} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <header className="space-y-3">
            <h1 className="font-serif-display text-4xl leading-tight">{stay.name}</h1>
            <div className="text-sm text-muted-foreground">
              {stay.location} · 최대 {stay.max_guests}명
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-foreground" />
              <span className="font-medium">{stay.rating}</span>
              <span className="text-muted-foreground">· 후기 {stay.reviews}개</span>
            </div>
          </header>

          <Divider />

          {stay.host_name && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0" style={{
                  background: FALLBACK_GRADIENTS[idHash % FALLBACK_GRADIENTS.length],
                  borderRadius: "9999px",
                }} />
                <div>
                  <div className="text-sm font-medium">호스트: {stay.host_name}</div>
                  <div className="text-xs text-muted-foreground">Stays 호스트</div>
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* 편의시설 */}
          {stay.amenities.length > 0 && (
            <>
              <section className="space-y-4">
                <h2 className="font-serif-display text-xl">편의시설</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {stay.amenities.map((name) => {
                    const Icon = AMENITY_ICONS[name] ?? Wifi;
                    return (
                      <div key={name} className="flex items-center gap-3 text-sm">
                        <Icon className="h-4 w-4 text-foreground" />
                        <span>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
              <Divider />
            </>
          )}

          {/* 숙소 소개 */}
          {stay.description && (
            <>
              <section className="space-y-3">
                <h2 className="font-serif-display text-xl">숙소 소개</h2>
                <p className="text-sm leading-relaxed text-foreground/80">{stay.description}</p>
              </section>
              <Divider />
            </>
          )}

          {/* 위치 */}
          <section className="space-y-4">
            <h2 className="font-serif-display text-xl">위치</h2>
            <KakaoMap
              center={stay.latitude && stay.longitude
                ? { lat: stay.latitude, lng: stay.longitude }
                : { lat: 37.5, lng: 127.0 }}
              level={5}
              height={300}
              markers={stay.latitude && stay.longitude ? [{
                id: stay.id,
                lat: stay.latitude,
                lng: stay.longitude,
                label: stay.name,
                info: stay.name,
              }] : []}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {stay.address ?? stay.location}
            </div>
          </section>

          <Divider />

          {/* 후기 */}
          <section className="space-y-5">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif-display text-xl">후기 {stay.reviews}개</h2>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-foreground" />
                <span className="font-medium">{stay.rating}</span>
              </div>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 후기가 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {reviews.map((r) => (
                  <div key={r.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9" style={{
                        background: `linear-gradient(135deg, hsl(${r.user_name.charCodeAt(0) * 7 % 360} 30% 70%), hsl(${r.user_name.charCodeAt(0) * 11 % 360} 40% 45%))`,
                        borderRadius: "9999px",
                      }} />
                      <div>
                        <div className="text-sm font-medium">{r.user_name}</div>
                        <div className="text-xs text-muted-foreground">{r.created_at}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-foreground" />
                      ))}
                    </div>
                    {r.content && <p className="text-sm leading-relaxed text-foreground/80">{r.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 예약 카드 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 bg-background p-6" style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                {hasEvent && <span className="text-sm text-muted-foreground line-through">₩{price.toLocaleString()}</span>}
                <span className="font-serif-display text-3xl">₩{discountedPrice.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/ 박</span>
                {hasEvent && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium text-background" style={{ background: "hsl(0 70% 50%)", borderRadius: "4px" }}>
                    -{discountPct}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-foreground" />
                <span className="font-medium">{stay.rating}</span>
              </div>
            </div>
            {hasEvent && <div className="text-xs" style={{ color: "hsl(150 60% 35%)" }}>{couponCode} 적용됨 ✓</div>}

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
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">인원</span>
                        <span className="text-sm">게스트 {guests}명</span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4" align="start">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">게스트</div>
                        <div className="text-xs text-muted-foreground">최대 {stay.max_guests}명</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}
                          className="flex h-8 w-8 items-center justify-center border border-foreground/30 disabled:opacity-30"
                          style={{ borderRadius: "4px" }}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{guests}</span>
                        <button onClick={() => setGuests(Math.min(stay.max_guests, guests + 1))} disabled={guests >= stay.max_guests}
                          className="flex h-8 w-8 items-center justify-center border border-foreground/30 disabled:opacity-30"
                          style={{ borderRadius: "4px" }}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Link to={bookingHref}
              className="block bg-foreground py-3 text-center text-sm text-background transition-opacity hover:opacity-90"
              style={{ borderRadius: "6px" }}>
              {hasEvent ? "지금 예약하기" : "예약하기"}
            </Link>

            <div className="space-y-2 text-sm">
              <Row label={`₩${discountedPrice.toLocaleString()} × ${nights}박`} value={`₩${subtotal.toLocaleString()}`} />
              <Row label="청소비" value={`₩${cleaning.toLocaleString()}`} />
              <Row label="서비스 수수료" value={`₩${service.toLocaleString()}`} />
              <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} className="pt-3">
                <Row label="총 합계" value={`₩${total.toLocaleString()}`} bold />
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">아직 요금이 청구되지 않습니다</p>
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

const DateField = ({ label, value, onChange }: { label: string; value?: Date; onChange: (d: Date | undefined) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
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
