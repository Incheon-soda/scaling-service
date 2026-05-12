import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, Calendar, Ticket, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const menu = [
  { to: "/admin", label: "대시보드", icon: Home, end: true },
  { to: "/admin/events", label: "이벤트 관리", icon: Calendar },
  { to: "/admin/coupons", label: "쿠폰 관리", icon: Ticket },
  { to: "/admin/stays", label: "숙소 관리", icon: Building2 },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex bg-[#0d0f14] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <aside
        className="fixed left-0 top-0 h-screen flex flex-col"
        style={{ width: 220, background: "#0d0f14", borderRight: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <div className="px-5 py-6">
          <span className="font-serif-display text-xl tracking-tight">Stays Admin</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                )
              }
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1" style={{ marginLeft: 220 }}>
        <div className="px-10 py-10 max-w-[1280px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
