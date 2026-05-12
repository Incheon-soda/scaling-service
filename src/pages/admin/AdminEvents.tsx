import { useState } from "react";
import { AdminButton, AdminCard, AdminHeader, AdminInput, AdminLabel, AdminSelect, AdminTable, AdminTextarea, Modal, StatusBadge, Td, Th } from "@/components/admin/ui";
import { STAYS } from "@/data/stays";

type Status = "진행중" | "예정" | "마감";
type EventRow = {
  id: string;
  name: string;
  start: string;
  end: string;
  discount: number;
  status: Status;
  stays: string[];
  coupons: number;
  desc?: string;
  region?: string;
  type?: string;
};

const SEED: EventRow[] = [
  { id: "e1", name: "솔데스크 오픈 기념", start: "2026-04-30", end: "2026-05-10", discount: 30, status: "진행중", stays: ["1", "2", "5"], coupons: 500, region: "전체", type: "오픈기념" },
  { id: "e2", name: "제주 봄 페스티벌 2026", start: "2026-05-01", end: "2026-05-15", discount: 40, status: "진행중", stays: ["1", "7", "8"], coupons: 300, region: "제주", type: "페스티벌" },
  { id: "e3", name: "여름 얼리버드 특가", start: "2026-06-01", end: "2026-06-20", discount: 25, status: "예정", stays: ["4", "6"], coupons: 800, region: "전체", type: "특가" },
  { id: "e4", name: "신년 연휴 프로모션", start: "2026-01-01", end: "2026-01-10", discount: 20, status: "마감", stays: ["3"], coupons: 200, region: "서울", type: "연휴" },
];

const STATUS_TONE: Record<Status, "green" | "blue" | "gray"> = { 진행중: "green", 예정: "blue", 마감: "gray" };

const empty: EventRow = { id: "", name: "", start: "", end: "", discount: 0, status: "예정", stays: [], coupons: 0, desc: "", region: "전체", type: "특가" };

const AdminEvents = () => {
  const [rows, setRows] = useState<EventRow[]>(SEED);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EventRow>(empty);

  const openNew = () => { setDraft({ ...empty, id: `e${Date.now()}` }); setOpen(true); };
  const openEdit = (r: EventRow) => { setDraft(r); setOpen(true); };
  const remove = (id: string) => setRows(rows.filter(r => r.id !== id));
  const save = () => {
    setRows(prev => prev.some(r => r.id === draft.id) ? prev.map(r => r.id === draft.id ? draft : r) : [draft, ...prev]);
    setOpen(false);
  };
  const toggleStay = (id: string) => setDraft(d => ({ ...d, stays: d.stays.includes(id) ? d.stays.filter(s => s !== id) : [...d.stays, id] }));

  return (
    <div>
      <AdminHeader title="이벤트 관리" action={<AdminButton onClick={openNew}>이벤트 추가</AdminButton>} />
      <AdminCard className="!p-0">
        <AdminTable>
          <thead><tr>
            <Th>이벤트명</Th><Th>기간</Th><Th>할인율</Th><Th>상태</Th><Th>참여숙소</Th><Th>쿠폰수량</Th><Th className="text-right">액션</Th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <Td className="text-white">{r.name}</Td>
                <Td className="text-white/60">{r.start} ~ {r.end}</Td>
                <Td>{r.discount}%</Td>
                <Td><StatusBadge tone={STATUS_TONE[r.status]}>{r.status}</StatusBadge></Td>
                <Td>{r.stays.length}개</Td>
                <Td>{r.coupons.toLocaleString()}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <AdminButton size="sm" variant="outline" onClick={() => openEdit(r)}>수정</AdminButton>
                    <AdminButton size="sm" variant="danger" onClick={() => remove(r.id)}>삭제</AdminButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      </AdminCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={rows.some(r => r.id === draft.id) ? "이벤트 수정" : "이벤트 추가"}
        footer={<>
          <AdminButton variant="outline" onClick={() => setOpen(false)}>취소</AdminButton>
          <AdminButton onClick={save}>저장</AdminButton>
        </>}
      >
        <div>
          <AdminLabel>이벤트명</AdminLabel>
          <AdminInput value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <AdminLabel>설명</AdminLabel>
          <AdminTextarea value={draft.desc} onChange={e => setDraft({ ...draft, desc: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AdminLabel>시작일</AdminLabel>
            <AdminInput type="date" value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} />
          </div>
          <div>
            <AdminLabel>종료일</AdminLabel>
            <AdminInput type="date" value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AdminLabel>할인율 (%)</AdminLabel>
            <AdminInput type="number" value={draft.discount} onChange={e => setDraft({ ...draft, discount: Number(e.target.value) })} />
          </div>
          <div>
            <AdminLabel>총 쿠폰 수량</AdminLabel>
            <AdminInput type="number" value={draft.coupons} onChange={e => setDraft({ ...draft, coupons: Number(e.target.value) })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <AdminLabel>상태</AdminLabel>
            <AdminSelect value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Status })}>
              {(["진행중", "예정", "마감"] as Status[]).map(s => <option key={s} value={s}>{s}</option>)}
            </AdminSelect>
          </div>
          <div>
            <AdminLabel>지역</AdminLabel>
            <AdminSelect value={draft.region} onChange={e => setDraft({ ...draft, region: e.target.value })}>
              {["전체", "서울", "제주", "부산", "광주", "완도"].map(s => <option key={s}>{s}</option>)}
            </AdminSelect>
          </div>
          <div>
            <AdminLabel>이벤트 타입</AdminLabel>
            <AdminSelect value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}>
              {["페스티벌", "연휴", "특가", "오픈기념"].map(s => <option key={s}>{s}</option>)}
            </AdminSelect>
          </div>
        </div>
        <div>
          <AdminLabel>참여 숙소</AdminLabel>
          <div className="rounded-md border border-white/10 max-h-40 overflow-y-auto p-2 space-y-1">
            {STAYS.map(s => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-white/80 px-2 py-1 hover:bg-white/5 rounded">
                <input type="checkbox" checked={draft.stays.includes(s.id)} onChange={() => toggleStay(s.id)} />
                <span>{s.name}</span>
                <span className="text-white/40 text-xs">· {s.location}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminEvents;
