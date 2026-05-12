import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { to: "/stays", label: "숙소 찾기" },
  { to: "/regions", label: "지역별" },
  { to: "/events", label: "이벤트" },
  { to: "/mypage", label: "내 예약" },
];

const Navbar = () => {
  const { isLoggedIn, user, logoutUser } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background" style={{ borderBottom: "0.5px solid hsl(0 0% 88%)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="font-serif-display text-2xl tracking-tight text-foreground">
          Stays
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition-colors hover:text-foreground ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link
                to="/mypage"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center bg-foreground text-xs text-background"
                  style={{ borderRadius: "9999px" }}
                >
                  {user?.name?.[0] || "U"}
                </span>
                <span className="hidden md:inline">{user?.name}</span>
              </Link>
              <button
                onClick={logoutUser}
                className="border border-foreground/80 px-4 py-2 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
                style={{ borderRadius: "4px" }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="border border-foreground/80 px-4 py-2 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
                style={{ borderRadius: "4px" }}
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-90"
                style={{ borderRadius: "4px" }}
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
