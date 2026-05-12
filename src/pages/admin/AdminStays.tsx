import { useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { AdminButton, AdminCard, AdminHeader, AdminInput, AdminLabel, AdminSelect, AdminTextarea, Modal } from "@/components/admin/ui";
import { STAYS, type Stay } from "@/data/stays";
import { cn } from "@/lib/utils";

const REGIONS = ["전체", "서울", "제주", "부산", "광주", "완도"];
const TYPES = ["전체", "호텔", "모텔", "리조트", "펜션"];
const AMENITIES = ["와이파이", "주차", "수영장", "조식포함", "에어컨", "바베큐", "온천", "반려동물", "세탁기", "주방"];

type Room = { name: string; capacity: number; price: number; count: number };
type StayDraft = {
  id: string;
  name: string;
  desc: string;
  region: string;
  address: string;
  type: string;
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  rooms: Room[];
};

const emptyDraft: StayDraft = { id: "", name: "", desc: "", region: "제주", address: "", type: "호텔", price: 0, capacity: 2, amenities: [], images: [], rooms: [] };

const AdminStays = () => {
  const [stays, setStays] = useState<Stay[]>(STAYS);
  const [region, setRegion] = useState("전체");
  const [type, setType] = useState("전체");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StayDraft>(emptyDraft);

  const filtered = useMemo(() => stays.filter(s =>
    (region === "전체" || s.location.includes(region)) &&
    (type === "전체" || s.category === type) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  ), [stays, region, type, search]);

  const openNew = () => { setDraft({ ...emptyDraft, id: `s${Date.now()}` }); setOpen(true); };
  const openEdit = (s: Stay) => {
    setDraft({
      id: s.id, name: s.name, desc: "", region: s.location.split(" ")[0], address: s.address ?? "",
      type: s.category, price: s.price, capacity: 2, amenities: [], images: [], rooms: [],
    });
    setOpen(true);
  };
  const remove = (id: string) => setStays(stays.filter(s => s.id !== id));
  const toggleAmenity = (a: string) => setDraft(d => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter(x => x !== a) : [...d.amenities, a] }));
  const addRoom = () => setDraft(d => ({ ...d, rooms: [...d.rooms, { name: "", capacity: 2, price: 0, count: 1 }] }));
  const updateRoom = (i: number, patch: Partial<Room>) => setDraft(d => ({ ...d, rooms: d.rooms.map((r, idx) => idx === i ? { ...r, ...patch } : r) }));
  const removeRoom = (i: number) => setDraft(d => ({ ...d, rooms: d.rooms.filter((_, idx) => idx !== i) }));

  const save = () => {
    const next: Stay = {
      id: draft.id, name: draft.name, location: `${draft.region} ${draft.address}`.trim(),
      category: draft.type, tags: draft.amenities.slice(0, 2), rating: 4.7, reviews: 0,
      price: draft.price, image: "linear-gradient(135deg, hsl(220 20% 60%), hsl(240 25% 35%))",
    };
    setStays(prev => prev.some(s => s.id === draft.id) ? prev.map(s => s.id === draft.id ? { ...s, ...next } : s) : [next, ...prev]);
    setOpen(false);
  };

  return (
    <div>
      <AdminHeader title="숙소 관리" action={<AdminButton onClick={openNew}>숙소 등록</AdminButton>} />

      <div className="space-y-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {REGIONS.map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className={cn("px-3 py-1.5 rounded-md text-xs border transition-colors",
                region === r ? "bg-white text-[#0d0f14] border-white" : "border-white/15 text-white/70 hover:border-white/30")}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          <AdminSelect value={type} onChange={e => setType(e.target.value)} className="!w-40">
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </AdminSelect>
          <AdminInput placeholder="숙소명 검색" value={search} onChange={e => setSearch(e.target.value)} className="!w-64" />
        </div>
      </div>

      <div className="text-xs text-white/50 mb-4">총 {filtered.length}개 숙소</div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map(s => (
          <AdminCard key={s.id} className="!p-0 overflow-hidden">
            <div style={{ height: 120, background: s.image }} />
            <div className="p-4 space-y-2">
              <div className="font-medium text-white">{s.name}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">{s.location}</span>
                <span className="px-1.5 py-0.5 border border-white/15 rounded text-white/70">{s.category}</span>
              </div>
              <div className="text-sm text-white">₩{s.price.toLocaleString()} <span className="text-white/40 text-xs">/박</span></div>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {s.rating} ({s.reviews})</span>
                <span>객실 {3 + (Number(s.id) % 5)}개</span>
              </div>
              <div className="flex gap-2 pt-2">
                <AdminButton size="sm" variant="outline" onClick={() => openEdit(s)}>수정</AdminButton>
                <AdminButton size="sm" variant="danger" onClick={() => remove(s.id)}>삭제</AdminButton>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={stays.some(s => s.id === draft.id) ? "숙소 수정" : "숙소 등록"}
        footer={<>
          <AdminButton variant="outline" onClick={() => setOpen(false)}>취소</AdminButton>
          <AdminButton onClick={save}>저장</AdminButton>
        </>}
      >
        <div>
          <AdminLabel>숙소명</AdminLabel>
          <AdminInput value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <AdminLabel>설명</AdminLabel>
          <AdminTextarea value={draft.desc} onChange={e => setDraft({ ...draft, desc: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AdminLabel>지역</AdminLabel>
            <AdminSelect value={draft.region} onChange={e => setDraft({ ...draft, region: e.target.value })}>
              {REGIONS.filter(r => r !== "전체").map(r => <option key={r}>{r}</option>)}
            </AdminSelect>
          </div>
          <div>
            <AdminLabel>숙소 타입</AdminLabel>
            <AdminSelect value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}>
              {TYPES.filter(t => t !== "전체").map(t => <option key={t}>{t}</option>)}
            </AdminSelect>
          </div>
        </div>
        <div>
          <AdminLabel>주소</AdminLabel>
          <AdminInput value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <AdminLabel>1박 기준 가격</AdminLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">₩</span>
              <AdminInput type="number" className="!pl-7" value={draft.price} onChange={e => setDraft({ ...draft, price: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <AdminLabel>최대 인원</AdminLabel>
            <AdminInput type="number" value={draft.capacity} onChange={e => setDraft({ ...draft, capacity: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <AdminLabel>편의시설</AdminLabel>
          <div className="grid grid-cols-3 gap-2">
            {AMENITIES.map(a => (
              <label key={a} className="flex items-center gap-2 text-sm text-white/80 px-2 py-1.5 rounded border border-white/10 hover:bg-white/5 cursor-pointer">
                <input type="checkbox" checked={draft.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                {a}
              </label>
            ))}
          </div>
        </div>
        <div>
          <AdminLabel>이미지 업로드 (최대 4장)</AdminLabel>
          <div className="border-2 border-dashed border-white/15 rounded-md p-8 text-center text-white/40 text-sm">
            드래그하여 업로드하거나 클릭하세요
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <AdminLabel>객실 관리</AdminLabel>
            <AdminButton size="sm" variant="outline" onClick={addRoom}>객실 추가</AdminButton>
          </div>
          <div className="space-y-2">
            {draft.rooms.length === 0 && (
              <div className="text-xs text-white/40 px-2 py-3 border border-white/10 rounded-md text-center">등록된 객실이 없습니다</div>
            )}
            {draft.rooms.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_120px_80px_32px] gap-2 items-center">
                <AdminInput placeholder="객실명" value={r.name} onChange={e => updateRoom(i, { name: e.target.value })} />
                <AdminInput type="number" placeholder="인원" value={r.capacity} onChange={e => updateRoom(i, { capacity: Number(e.target.value) })} />
                <AdminInput type="number" placeholder="가격" value={r.price} onChange={e => updateRoom(i, { price: Number(e.target.value) })} />
                <AdminInput type="number" placeholder="수량" value={r.count} onChange={e => updateRoom(i, { count: Number(e.target.value) })} />
                <button onClick={() => removeRoom(i)} className="h-10 w-8 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminStays;
