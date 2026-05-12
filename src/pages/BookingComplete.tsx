import { Link, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { BookingResult } from "@/lib/api";

const BookingComplete = () => {
  const location = useLocation();
  const booking: BookingResult | undefined = location.state?.booking;

  if (!booking) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
        <h1 className="font-serif-display text-3xl">예약 정보를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sm text-muted-foreground">예약 내역은 마이페이지에서 확인하세요.</p>
        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          <Link
            to="/mypage"
            className="flex items-center justify-center border border-foreground py-3 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
            style={{ borderRadius: "6px" }}
          >
            예약 내역 보기
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center bg-foreground py-3 text-sm text-background transition-opacity hover:opacity-90"
            style={{ borderRadius: "6px" }}
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  const bookingNumber = `STAYS-${booking.id.slice(0, 8).toUpperCase()}`;
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-16 text-center">
      <div
        className="mb-8 flex h-20 w-20 items-center justify-center bg-foreground text-background"
        style={{ borderRadius: "9999px" }}
      >
        <Check className="h-10 w-10" strokeWidth={2.5} />
      </div>

      <h1 className="font-serif-display text-4xl leading-tight">예약이 완료되었습니다</h1>
      <p className="mt-3 text-sm text-muted-foreground">예약 확인 메일을 발송해 드렸습니다</p>

      <div
        className="mt-10 w-full space-y-4 bg-background p-6 text-left"
        style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
      >
        <Row label="예약번호" value={bookingNumber} mono />
        <Divider />
        <Row label="숙소" value={booking.stay_name ?? "-"} />
        {booking.room_name && <Row label="객실" value={booking.room_name} />}
        <Divider />
        <Row label="체크인" value={format(checkIn, "yyyy.MM.dd (E)", { locale: ko })} />
        <Row label="체크아웃" value={format(checkOut, "yyyy.MM.dd (E)", { locale: ko })} />
        <Row label="인원" value={`${booking.guests}명`} />
        <Divider />
        <Row label="숙박 요금" value={`₩${booking.original_price.toLocaleString()}`} />
        <Row label="청소비" value={`₩${booking.cleaning_fee.toLocaleString()}`} />
        <Row label="서비스 수수료" value={`₩${booking.service_fee.toLocaleString()}`} />
        {booking.discount_amount > 0 && (
          <Row label="쿠폰 할인" value={`-₩${booking.discount_amount.toLocaleString()}`} />
        )}
        <Divider />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">총 결제금액</span>
          <span className="font-serif-display text-2xl">₩{booking.total_price.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <Link
          to="/mypage"
          className="flex items-center justify-center border border-foreground py-3 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
          style={{ borderRadius: "6px" }}
        >
          예약 내역 보기
        </Link>
        <Link
          to="/"
          className="flex items-center justify-center bg-foreground py-3 text-sm text-background transition-opacity hover:opacity-90"
          style={{ borderRadius: "6px" }}
        >
          홈으로
        </Link>
      </div>
    </div>
  );
};

const Divider = () => <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} />;

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
  </div>
);

export default BookingComplete;
