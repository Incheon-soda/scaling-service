import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Settings, LogOut, CalendarCheck, Ticket } from "lucide-react";
import { STAYS } from "@/data/stays";
import StayCard from "@/components/StayCard";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getMyBookings, type BookingResult } from "@/lib/api";

type MenuKey = "bookings" | "profile" | "wishlist" | "coupons" | "logout";

const MENU: { key: MenuKey; label: string; icon: React.ElementType; href?: string }[] = [
  { key: "bookings", label: "내 예약", icon: CalendarCheck },
  { key: "profile", label: "프로필 수정", icon: Settings },
  { key: "wishlist", label: "찜한 숙소", icon: Heart },
  { key: "coupons", label: "내 쿠폰", icon: Ticket, href: "/mypage/coupons" },
  { key: "logout", label: "로그아웃", icon: LogOut },
];

const MyPage = () => {
  const [active, setActive] = useState<MenuKey>("bookings");
  const { user, isLoggedIn, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleMenuClick = (key: MenuKey) => {
    if (key === "logout") {
      logoutUser();
      navigate("/");
      return;
    }
    setActive(key);
  };

  if (!isLoggedIn) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">로그인이 필요합니다</p>
        <Link to="/login" className="mt-4 inline-block bg-foreground px-6 py-2 text-sm text-background" style={{ borderRadius: "4px" }}>
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
      {/* SIDEBAR */}
      <aside className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center bg-foreground text-sm font-medium text-background"
            style={{ borderRadius: "9999px" }}
          >
            {user?.name?.[0] || "U"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} />

        <nav className="flex flex-col">
          {MENU.map((m) => {
            const isActive = active === m.key;
            const className = cn(
              "flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors",
              isActive
                ? "border-l-2 border-foreground bg-foreground/[0.03] font-medium text-foreground"
                : "border-l-2 border-transparent text-muted-foreground hover:text-foreground",
            );
            if (m.href) {
              return (
                <Link key={m.key} to={m.href} className={className}>
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </Link>
              );
            }
            return (
              <button key={m.key} onClick={() => handleMenuClick(m.key)} className={className}>
                <m.icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* CONTENT */}
      <section>
        {active === "bookings" && <BookingsTab />}
        {active === "profile" && <ProfileTab user={user} />}
        {active === "wishlist" && <WishlistTab />}
      </section>
    </div>
  );
};

/* ---------- BOOKINGS ---------- */
type BookingStatus = "예약중" | "이용완료" | "취소됨";

const STATUS_TABS = ["전체", "예약중", "이용완료", "취소됨"] as const;

const mapStatus = (status: string): BookingStatus => {
  switch (status) {
    case "confirmed": return "예약중";
    case "completed": return "이용완료";
    case "cancelled": return "취소됨";
    default: return "예약중";
  }
};

const BookingsTab = () => {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("전체");
  const [bookings, setBookings] = useState<BookingResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "전체"
    ? bookings
    : bookings.filter((b) => mapStatus(b.status) === tab);

  return (
    <div className="space-y-6">
      <h1 className="font-serif-display text-3xl">내 예약</h1>

      <div className="flex gap-6" style={{ borderBottom: "0.5px solid hsl(0 0% 85%)" }}>
        {STATUS_TABS.map((t) => (
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

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">로딩 중...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              해당 상태의 예약이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BookingCard = ({ booking }: { booking: BookingResult }) => {
  const status = mapStatus(booking.status);
  const cancelled = status === "취소됨";

  return (
    <div
      className={cn("flex gap-4 bg-background p-4", cancelled && "opacity-70")}
      style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
    >
      <div
        className="h-20 w-20 shrink-0"
        style={{
          background: "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
          borderRadius: "6px",
        }}
      />
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="space-y-1">
          <StatusBadge status={status} />
          <div className="text-sm font-medium">{booking.stay_name || "숙소"}</div>
          <div className="text-xs text-muted-foreground">{booking.room_name || "객실"}</div>
          <div className="text-xs text-muted-foreground">
            {booking.check_in} ~ {booking.check_out} · {booking.guests}명
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        <div className="text-sm font-medium">₩{booking.total_price.toLocaleString()}</div>
        {status === "예약중" && (
          <SmallButton>예약 취소</SmallButton>
        )}
        {status === "이용완료" && (
          <SmallButton>후기 작성</SmallButton>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles =
    status === "예약중"
      ? { background: "hsl(0 0% 13%)", color: "hsl(0 0% 100%)", border: "0.5px solid hsl(0 0% 13%)" }
      : status === "이용완료"
      ? { background: "transparent", color: "hsl(0 0% 40%)", border: "0.5px solid hsl(0 0% 75%)" }
      : { background: "hsl(0 70% 97%)", color: "hsl(0 60% 45%)", border: "0.5px solid hsl(0 60% 80%)" };

  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-medium"
      style={{ ...styles, borderRadius: "4px" }}
    >
      {status}
    </span>
  );
};

const SmallButton = ({ children }: { children: React.ReactNode }) => (
  <button
    className="border border-foreground/80 bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-foreground hover:text-background"
    style={{ borderRadius: "4px" }}
  >
    {children}
  </button>
);

/* ---------- PROFILE ---------- */
const ProfileTab = ({ user }: { user: any }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPw: "",
    newPw: "",
    confirmPw: "",
  });

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-serif-display text-3xl">프로필 수정</h1>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        <ProfileField label="이름" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <ProfileField label="이메일" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <ProfileField label="전화번호" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

        <div style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} className="pt-6">
          <h2 className="font-serif-display text-xl">비밀번호 변경</h2>
          <div className="mt-4 space-y-4">
            <ProfileField label="현재 비밀번호" type="password" value={form.currentPw} onChange={(v) => setForm({ ...form, currentPw: v })} />
            <ProfileField label="새 비밀번호" type="password" value={form.newPw} onChange={(v) => setForm({ ...form, newPw: v })} />
            <ProfileField label="비밀번호 확인" type="password" value={form.confirmPw} onChange={(v) => setForm({ ...form, confirmPw: v })} />
          </div>
        </div>

        <button
          type="submit"
          className="bg-foreground px-6 py-3 text-sm text-background transition-opacity hover:opacity-90"
          style={{ borderRadius: "6px" }}
        >
          저장하기
        </button>
      </form>
    </div>
  );
};

const ProfileField = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-foreground/80">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={255}
      className="w-full bg-background px-3 py-2.5 text-sm focus:outline-none"
      style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "6px" }}
    />
  </div>
);

/* ---------- WISHLIST ---------- */
const WishlistTab = () => {
  const wishlisted = STAYS.slice(0, 4);
  return (
    <div className="space-y-6">
      <h1 className="font-serif-display text-3xl">찜한 숙소</h1>
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
        {wishlisted.map((s) => (
          <StayCard key={s.id} stay={s} />
        ))}
      </div>
    </div>
  );
};

export default MyPage;
