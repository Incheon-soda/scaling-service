import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Check, CalendarIcon, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  getStay, getStayRooms, validateCoupon, createBooking,
  type StayDetail, type RoomItem, ApiError,
} from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

const Booking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();

  const stayId = searchParams.get("stay_id") || "";
  const eventId = searchParams.get("event_id") || undefined;
  const couponParam = searchParams.get("coupon") || "";

  const [stay, setStay] = useState<StayDetail | null>(null);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState<RoomItem | null>(null);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [payment, setPayment] = useState("card");
  const [form, setForm] = useState({ name: "", email: "", phone: "", request: "" });

  const [couponInput, setCouponInput] = useState(couponParam);
  const [couponId, setCouponId] = useState<string | undefined>();
  const [couponState, setCouponState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다");
      navigate("/login");
      return;
    }
    if (!stayId) {
      navigate("/stays");
      return;
    }
    Promise.all([getStay(stayId), getStayRooms(stayId)])
      .then(([s, r]) => {
        setStay(s);
        setRooms(r);
        if (r.length > 0) setSelectedRoom(r[0]);
        // URL에 쿠폰 코드가 있으면 자동 검증 및 적용
        if (couponParam) {
          validateCoupon({ coupon_code: couponParam, stay_id: stayId || undefined })
            .then((res) => {
              if (res.valid) {
                setAppliedDiscount(res.discount_rate);
                setCouponId(res.coupon_id);
                setCouponState("success");
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => toast.error("숙소 정보를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, [stayId, isLoggedIn]);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000))
    : 1;

  const roomPrice = selectedRoom?.price ?? stay?.price ?? 0;
  const subtotal = roomPrice * nights;
  const cleaning = 30000;
  const service = Math.round(subtotal * 0.05);
  const couponDiscount = Math.round(subtotal * appliedDiscount / 100);
  const total = subtotal + cleaning + service - couponDiscount;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponState("loading");
    try {
      const res = await validateCoupon({ coupon_code: code, stay_id: stayId || undefined });
      if (res.valid) {
        setAppliedDiscount(res.discount_rate);
        setCouponId(res.coupon_id);
        setCouponState("success");
        toast.success(res.message);
      } else {
        setCouponState("error");
        toast.error(res.message);
      }
    } catch {
      setCouponState("error");
      toast.error("쿠폰 확인에 실패했습니다");
    }
  };

  const removeCoupon = () => {
    setCouponInput("");
    setCouponId(undefined);
    setAppliedDiscount(0);
    setCouponState("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stay || !selectedRoom || !checkIn || !checkOut) {
      toast.error("날짜와 객실을 선택해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await createBooking({
        stay_id: stay.id,
        room_id: selectedRoom.id,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests: adults + children,
        coupon_id: couponId,
        event_id: eventId,
      });
      navigate("/booking/complete", { state: { booking } });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("예약에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">로딩 중...</div>;
  }

  if (!stay) {
    return <div className="py-20 text-center text-sm text-muted-foreground">숙소를 찾을 수 없습니다</div>;
  }

  return (
    <div className="space-y-10">
      <h1 className="font-serif-display text-4xl">예약 확인</h1>
      <Steps />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 날짜 및 인원 */}
          <Section title="날짜 및 인원">
            <div className="grid grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-left"
                    style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "6px" }}
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(!checkIn && "text-muted-foreground")}>
                      {checkIn ? format(checkIn, "yyyy.MM.dd (E)", { locale: ko }) : "체크인"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-left"
                    style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "6px" }}
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(!checkOut && "text-muted-foreground")}>
                      {checkOut ? format(checkOut, "yyyy.MM.dd (E)", { locale: ko }) : "체크아웃"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <Counter label="성인" sub="만 13세 이상" value={adults} onChange={setAdults} min={1} />
            <Counter label="아동" sub="만 2-12세" value={children} onChange={setChildren} min={0} />
          </Section>

          <Divider />

          {/* 객실 선택 */}
          {rooms.length > 0 && (
            <>
              <Section title="객실 선택">
                <div className="space-y-2">
                  {rooms.map((r) => (
                    <label
                      key={r.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between px-4 py-3 text-sm transition-colors",
                        r.remaining_count === 0 && "pointer-events-none opacity-40",
                        selectedRoom?.id === r.id ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02]",
                      )}
                      style={{
                        border: selectedRoom?.id === r.id
                          ? "0.5px solid hsl(0 0% 13%)"
                          : "0.5px solid hsl(0 0% 80%)",
                        borderRadius: "6px",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="room"
                          checked={selectedRoom?.id === r.id}
                          onChange={() => setSelectedRoom(r)}
                          disabled={r.remaining_count === 0}
                          className="h-4 w-4 accent-foreground"
                        />
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">
                            최대 {r.max_guests}명 · 잔여 {r.remaining_count}개
                          </div>
                        </div>
                      </div>
                      <span className="font-medium">₩{r.price.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </Section>
              <Divider />
            </>
          )}

          {/* 쿠폰 */}
          <Section title="쿠폰 적용">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); if (couponState !== "success") setCouponState("idle"); }}
                  disabled={couponState === "success" || couponState === "loading"}
                  placeholder="쿠폰 코드를 입력하세요"
                  className="flex-1 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none disabled:bg-foreground/[0.03]"
                  style={{
                    border: couponState === "success"
                      ? "0.5px solid hsl(150 60% 40%)"
                      : couponState === "error"
                      ? "0.5px solid hsl(0 70% 55%)"
                      : "0.5px solid hsl(0 0% 80%)",
                    borderRadius: "6px",
                  }}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponState === "success" || couponState === "loading"}
                  className="bg-foreground px-4 py-2.5 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ borderRadius: "6px" }}
                >
                  {couponState === "loading" ? "확인 중..." : "적용하기"}
                </button>
              </div>
              {couponState === "success" && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "hsl(150 60% 35%)" }}>
                    {couponInput.toUpperCase()} · {appliedDiscount}% 할인 적용됨 ✓
                  </span>
                  <button type="button" onClick={removeCoupon} className="text-muted-foreground underline-offset-2 hover:underline">
                    쿠폰 제거
                  </button>
                </div>
              )}
              {couponState === "error" && (
                <p className="text-xs" style={{ color: "hsl(0 70% 50%)" }}>유효하지 않거나 이미 사용된 쿠폰입니다</p>
              )}
            </div>
          </Section>

          <Divider />

          {/* 예약자 정보 */}
          <Section title="예약자 정보">
            <Field label="이름" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="홍길동" />
            <Field label="이메일" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="example@stays.com" />
            <Field label="전화번호" type="tel" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="010-0000-0000" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/80">
                특별 요청사항 <span className="text-muted-foreground">(선택)</span>
              </label>
              <textarea
                value={form.request}
                onChange={(e) => setForm({ ...form, request: e.target.value })}
                placeholder="호스트에게 전달할 메시지를 작성해주세요"
                rows={4}
                maxLength={500}
                className="w-full bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "6px" }}
              />
            </div>
          </Section>

          <Divider />

          {/* 결제 수단 */}
          <Section title="결제 수단">
            <div className="space-y-2">
              {[
                { id: "card", label: "신용카드 / 체크카드" },
                { id: "kakao", label: "카카오페이" },
                { id: "naver", label: "네이버페이" },
              ].map((p) => (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors",
                    payment === p.id ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02]",
                  )}
                  style={{
                    border: payment === p.id ? "0.5px solid hsl(0 0% 13%)" : "0.5px solid hsl(0 0% 80%)",
                    borderRadius: "6px",
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={p.id}
                    checked={payment === p.id}
                    onChange={() => setPayment(p.id)}
                    className="h-4 w-4 accent-foreground"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </Section>

          <Divider />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-foreground py-3.5 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ borderRadius: "6px" }}
          >
            {submitting ? "예약 처리 중..." : "예약 확정하기"}
          </button>
          <p className="text-center text-xs text-muted-foreground">예약 확정 후 취소 정책이 적용됩니다</p>
        </form>

        {/* 우측 요약 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 bg-background p-5" style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}>
            <div className="flex gap-3">
              <div
                className="h-20 w-24 shrink-0"
                style={{
                  background: stay.image_url
                    ? `url(${stay.image_url}) center/cover no-repeat`
                    : "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
                  borderRadius: "6px",
                }}
              />
              <div className="min-w-0 space-y-1">
                <div className="text-xs text-muted-foreground">{stay.location}</div>
                <div className="text-sm font-medium leading-snug">{stay.name}</div>
                {selectedRoom && <div className="text-xs text-muted-foreground">{selectedRoom.name}</div>}
              </div>
            </div>

            <Divider />

            <div className="space-y-2 text-sm">
              <Row label="체크인" value={checkIn ? format(checkIn, "yyyy.MM.dd (E)", { locale: ko }) : "날짜 선택"} />
              <Row label="체크아웃" value={checkOut ? format(checkOut, "yyyy.MM.dd (E)", { locale: ko }) : "날짜 선택"} />
              <Row label="인원" value={`성인 ${adults}명${children ? ` · 아동 ${children}명` : ""}`} />
              <Row label="기간" value={`${nights}박`} />
            </div>

            <Divider />

            <div className="space-y-2 text-sm">
              <Row label={`₩${roomPrice.toLocaleString()} × ${nights}박`} value={`₩${subtotal.toLocaleString()}`} />
              <Row label="청소비" value={`₩${cleaning.toLocaleString()}`} />
              <Row label="서비스 수수료" value={`₩${service.toLocaleString()}`} />
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span style={{ color: "hsl(150 60% 35%)" }}>쿠폰 할인 ({appliedDiscount}%)</span>
                  <span style={{ color: "hsl(150 60% 35%)" }}>-₩{couponDiscount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} className="pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">총 합계</span>
                <div className="flex items-baseline gap-2">
                  {couponDiscount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      ₩{(total + couponDiscount).toLocaleString()}
                    </span>
                  )}
                  <span className="font-serif-display text-2xl">₩{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Steps = () => {
  const steps = [
    { n: 1, label: "숙소 선택", done: true },
    { n: 2, label: "예약 확인", current: true },
    { n: 3, label: "완료" },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center text-xs",
                (s.done || s.current) ? "bg-foreground text-background" : "border border-foreground/30 text-muted-foreground",
              )}
              style={{ borderRadius: "9999px" }}
            >
              {s.done ? <Check className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span className={cn("text-sm", s.current ? "font-medium text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="h-px w-8 bg-foreground/20 md:w-16" />}
        </div>
      ))}
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="font-serif-display text-xl">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const Divider = () => <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} />;

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-foreground/80">{label}</span>
    <span>{value}</span>
  </div>
);

const Counter = ({ label, sub, value, onChange, min = 0 }: {
  label: string; sub: string; value: number; onChange: (n: number) => void; min?: number;
}) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center border border-foreground/30 disabled:opacity-30"
        style={{ borderRadius: "4px" }}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-6 text-center text-sm">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center border border-foreground/30"
        style={{ borderRadius: "4px" }}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", placeholder, required, maxLength }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; maxLength?: number;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-foreground/80">
      {label}{required && <span className="ml-0.5 text-foreground">*</span>}
    </label>
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} maxLength={maxLength}
      className="w-full bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none"
      style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "6px" }}
    />
  </div>
);

export default Booking;
