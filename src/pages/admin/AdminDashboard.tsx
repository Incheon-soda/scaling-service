import { AdminCard, AdminHeader } from "@/components/admin/ui";

const stats = [
  { label: "전체 숙소", value: "123" },
  { label: "진행중 이벤트", value: "4" },
  { label: "발급된 쿠폰", value: "100" },
  { label: "이번 달 예약", value: "847" },
];

const AdminDashboard = () => {
  return (
    <div>
      <AdminHeader title="대시보드" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <AdminCard key={s.label}>
            <div className="text-xs text-white/50 mb-2">{s.label}</div>
            <div className="font-serif-display text-3xl">{s.value}</div>
          </AdminCard>
        ))}
      </div>
      <AdminCard>
        <div className="text-sm text-white/60">관리 메뉴에서 이벤트, 쿠폰, 숙소를 관리하세요.</div>
      </AdminCard>
    </div>
  );
};

export default AdminDashboard;
