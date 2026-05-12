import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { AdminButton, AdminCard, AdminHeader, AdminInput, AdminLabel, AdminSelect, AdminTable, Modal, StatusBadge, Td, Th } from "@/components/admin/ui";
import { STAYS } from "@/data/stays";

type CouponStatus = "사용가능" | "사용완료";
type Coupon = {
  code: string;
  event: string;
  discount: number;
  status: CouponStatus;
  issuedAt: string;
  usedAt?: string;
  user?: string;
  stayIds: string[]; // empty = 전체
  usedStay?: string;
};

const EVENTS = ["솔데스크 오픈 기념", "제주 봄 페스티벌 2026", "여름 얼리버드 특가", "신년 연휴 프로모션"];

// Extra fake stays specifically for coupon scope demo
const EXTRA_STAYS = [
  { id: "sd-gangnam", name: "솔데스크 강남" },
  { id: "sd-gangnam1", name: "솔데스크 강남1" },
  { id: "sd-jongno", name: "솔데스크 종로" },
];
const ALL_STAYS = [
  ...EXTRA_STAYS,
  ...STAYS.map(s => ({ id: s.id, name: s.name })),
];

const SEED: Coupon[] = Array.from({ length: 10 }).map((_, i) => {
  const used = i < 3;
  const restricted = i % 3 === 0;
  return {
    code: `SOLD-${String(i + 1).padStart(4, "0")}`,
    event: EVENTS[i % EVENTS.length],
    discount: [20, 25, 30, 40][i % 4],
    status: used ? "사용완료" : "사용가능",
    issuedAt: `2026-04-${String(10 + i).padStart(2, "0")}`,
    usedAt: used ? `2026-04-${String(15 + i).padStart(2, "0")}` : undefined,
    user: used ? `user${i + 1}@stays.kr` : undefined,
    stayIds: restricted ? ["sd-gangnam", "sd-gangnam1", "sd-jongno"] : [],
    usedStay: used ? ALL_STAYS[i % ALL_STAYS.length].name : undefined,
  };
});

const AdminCoupons = () => {
  const [rows, setRows] = useState<Coupon[]>(SEED);
  const [eventFilter, setEventFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Coupon | null>(null);

  // Add modal state
  const [evt, setEvt] = useState(EVENTS[0]);
  const [prefix, setPrefix] = useState("SOLD-");
  const [qty, setQty] = useState(10);
  const [discount, setDiscount] = useState(30);
  const [expires, setExpires] = useState("");
  const [autoGen, setAutoGen] = useState(true);
  const [restrictStays, setRestrictStays] = useState(false);
  const [selectedStays, setSelectedStays] = useState<string[]>(["sd-gangnam", "sd-gangnam1", "sd-jongno"]);
  const [staySearch, setStaySearch] = useState("");

  const filtered = useMemo(() => rows.filter(r =>
    (eventFilter === "전체" || r.event === eventFilter) &&
    (statusFilter === "전체" || r.status === statusFilter) &&
    (!search || r.code.toLowerCase().includes(search.toLowerCase()))
  ), [rows, eventFilter, statusFilter, search]);

  const filteredStayList = useMemo(() =>
    ALL_STAYS.filter(s => !staySearch || s.name.toLowerCase().includes(staySearch.toLowerCase()))
  , [staySearch]);

  const total = rows.length;
  const available = rows.filter(r => r.status === "사용가능").length;
  const used = rows.filter(r => r.status === "사용완료").length;
  const rate = total ? Math.round((used / total) * 100) : 0;

  const create = () => {
    const start = rows.length;
    const next: Coupon[] = Array.from({ length: qty }).map((_, i) => ({
      code: autoGen ? `${prefix}${String(start + i + 1).padStart(4, "0")}` : `${prefix}NEW${i}`,
      event: evt,
      discount,
      status: "사용가능",
      issuedAt: new Date().toISOString().slice(0, 10),
      stayIds: restrictStays ? selectedStays : [],
    }));
    setRows([...next, ...rows]);
    setOpen(false);
  };

  const toggleStay = (id: string) =>
    setSelectedStays(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const stayName = (id: string) => ALL_STAYS.find(s => s.id === id)?.name ?? id;

  const stats = [
    { label: "전체 쿠폰", value: `${total}개` },
    { label: "사용가능", value: `${available}개` },
    { label: "사용완료", value: `${used}개` },
    { label: "사용률", value: `${rate}%` },
  ];

  return (
    <div>
      <AdminHeader title="쿠폰 관리" action={<AdminButton onClick={() => setOpen(true)}>쿠폰 생성</AdminButton>} />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <AdminCard key={s.label}>
            <div className="text-xs text-white/50 mb-2">{s.label}</div>
            <div className="font-serif-display text-2xl">{s.value}</div>
          </AdminCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <AdminSelect value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="!w-56">
          <option>전체</option>
          {EVENTS.map(e => <option key={e}>{e}</option>)}
        </AdminSelect>
        <AdminSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="!w-40">
          {["전체", "사용가능", "사용완료"].map(s => <option key={s}>{s}</option>)}
        </AdminSelect>
        <AdminInput placeholder="쿠폰 코드 검색" value={search} onChange={e => setSearch(e.target.value)} className="!w-64" />
      </div>

      <AdminCard className="!p-0">
        <AdminTable>
          <thead><tr>
            <Th>쿠폰코드</Th><Th>이벤트명</Th><Th>할인율</Th><Th>사용가능 숙소</Th><Th>상태</Th><Th>발급일</Th><Th>사용일</Th><Th>사용자</Th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr
                key={r.code}
                onClick={() => setDetail(r)}
                className="cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <Td className="text-white font-mono text-xs">{r.code}</Td>
                <Td>{r.event}</Td>
                <Td>{r.discount}%</Td>
                <Td>
                  {r.stayIds.length === 0 ? (
                    <span className="text-white/40 text-xs">전체 숙소</span>
                  ) : (
                    <div className="relative group inline-block">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] text-white">
                        솔데스크 {r.stayIds.length}곳
                      </span>
                      <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-[#0d0f14] border border-white/15 rounded-md p-2 min-w-[160px] shadow-xl">
                        {r.stayIds.map(id => (
                          <div key={id} className="text-[11px] text-white/80 py-0.5">{stayName(id)}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </Td>
                <Td><StatusBadge tone={r.status === "사용가능" ? "green" : "gray"}>{r.status}</StatusBadge></Td>
                <Td className="text-white/60">{r.issuedAt}</Td>
                <Td className="text-white/60">{r.usedAt ?? "—"}</Td>
                <Td className="text-white/60">{r.user ?? "—"}</Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="쿠폰 생성"
        footer={<>
          <AdminButton variant="outline" onClick={() => setOpen(false)}>취소</AdminButton>
          <AdminButton onClick={create}>생성</AdminButton>
        </>}
      >
        <div>
          <AdminLabel>이벤트 선택</AdminLabel>
          <AdminSelect value={evt} onChange={e => setEvt(e.target.value)}>
            {EVENTS.map(e => <option key={e}>{e}</option>)}
          </AdminSelect>
        </div>
        <div>
          <AdminLabel>쿠폰 코드 prefix</AdminLabel>
          <AdminInput value={prefix} onChange={e => setPrefix(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AdminLabel>발급 수량</AdminLabel>
            <AdminInput type="number" value={qty} onChange={e => setQty(Number(e.target.value))} />
          </div>
          <div>
            <AdminLabel>할인율 (%)</AdminLabel>
            <AdminInput type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          </div>
        </div>

        {/* 사용 가능 숙소 제한 */}
        <div className="rounded-md border border-white/10 p-3 space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-sm text-white">사용 가능 숙소 제한</div>
              <div className="text-xs text-white/50 mt-1">특정 숙소만 사용 가능</div>
            </div>
            <button
              type="button"
              onClick={() => setRestrictStays(!restrictStays)}
              className={`relative w-10 h-5 rounded-full transition-colors ${restrictStays ? "bg-white" : "bg-white/20"}`}
            >
              <span className={`absolute top-0.5 ${restrictStays ? "left-5 bg-[#0d0f14]" : "left-0.5 bg-white"} w-4 h-4 rounded-full transition-all`} />
            </button>
          </label>

          {!restrictStays ? (
            <div className="text-xs text-white/40">전체 숙소 사용 가능</div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                <AdminInput
                  placeholder="숙소명 검색"
                  value={staySearch}
                  onChange={e => setStaySearch(e.target.value)}
                  className="!pl-8"
                />
              </div>
              <div className="flex gap-2">
                <AdminButton size="sm" variant="outline" onClick={() => setSelectedStays(filteredStayList.map(s => s.id))}>전체 선택</AdminButton>
                <AdminButton size="sm" variant="outline" onClick={() => setSelectedStays([])}>전체 해제</AdminButton>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border border-white/10 divide-y divide-white/5">
                {filteredStayList.map(s => {
                  const checked = selectedStays.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStay(s.id)}
                        className="accent-white"
                      />
                      <span className="text-xs text-white/80">{s.name}</span>
                    </label>
                  );
                })}
              </div>
              {selectedStays.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedStays.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[11px] text-white">
                      {stayName(id)}
                      <button onClick={() => toggleStay(id)} className="text-white/60 hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <AdminLabel>유효기간</AdminLabel>
          <AdminInput type="date" value={expires} onChange={e => setExpires(e.target.value)} />
        </div>
        <label className="flex items-center justify-between p-3 rounded-md border border-white/10 cursor-pointer">
          <div>
            <div className="text-sm text-white">코드 자동 생성</div>
            <div className="text-xs text-white/50 mt-1">prefix + 4자리 숫자 자동 생성</div>
          </div>
          <button
            type="button"
            onClick={() => setAutoGen(!autoGen)}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoGen ? "bg-white" : "bg-white/20"}`}
          >
            <span className={`absolute top-0.5 ${autoGen ? "left-5 bg-[#0d0f14]" : "left-0.5 bg-white"} w-4 h-4 rounded-full transition-all`} />
          </button>
        </label>
      </Modal>

      {/* Detail slide panel */}
      {detail && (
        <div className="fixed inset-0 z-50" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            onClick={e => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-[320px] bg-[#0d0f14] border-l overflow-y-auto"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="font-serif-display text-lg text-white">쿠폰 상세</h2>
              <button onClick={() => setDetail(null)} className="text-white/60 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">코드</span>
                  <span className="font-mono text-white">{detail.code}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">이벤트</span>
                  <span className="text-white">{detail.event}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">할인율</span>
                  <span className="text-white">{detail.discount}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">유효기간</span>
                  <span className="text-white">2026.05.31</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">상태</span>
                  <StatusBadge tone={detail.status === "사용가능" ? "green" : "gray"}>{detail.status}</StatusBadge>
                </div>
              </div>

              <div>
                <div className="text-xs text-white/50 mb-2">사용 가능 숙소</div>
                {detail.stayIds.length === 0 ? (
                  <div className="rounded-md border border-white/10 px-3 py-3 text-xs text-white/60">전체 숙소 사용 가능</div>
                ) : (
                  <div className="space-y-2">
                    {detail.stayIds.map(id => (
                      <div key={id} className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80">
                        {stayName(id)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-white/50 mb-2">사용 현황</div>
                {detail.status === "사용완료" ? (
                  <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">사용자</span>
                      <span className="text-white">{detail.user}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">사용일</span>
                      <span className="text-white">{detail.usedAt}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">사용 숙소</span>
                      <span className="text-white">{detail.usedStay}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-white/10 px-3 py-3 text-xs text-white/40">아직 사용되지 않은 쿠폰입니다</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
