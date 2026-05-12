import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "@/components/SearchBar";
import CategoryChips from "@/components/CategoryChips";
import StayCard from "@/components/StayCard";
import KakaoMap from "@/components/KakaoMap";
import { REGIONS } from "@/data/stays";
import { getStays, type StayItem } from "@/lib/api";

const Index = () => {
  const [category, setCategory] = useState<string>("전체");
  const [stays, setStays] = useState<StayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getStays({ category, limit: 4 })
      .then(setStays)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-3">
          <h1 className="font-serif-display text-4xl leading-tight md:text-5xl">
            머무는 순간이 여행이 되는 곳
          </h1>
          <p className="text-sm text-muted-foreground">전국의 특별한 숙소를 Stays에서 만나보세요.</p>
        </div>
        <SearchBar />
        <CategoryChips active={category} onChange={setCategory} />
      </section>

      <section className="space-y-6">
        <h2 className="font-serif-display text-3xl">추천 숙소</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-muted" style={{ height: "200px" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
            {stays.map((s) => (
              <StayCard key={s.id} stay={s} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="font-serif-display text-3xl">지역별 숙소 찾기</h2>
        <KakaoMap
          center={{ lat: 36.5, lng: 127.8 }}
          level={13}
          height={400}
          markers={REGIONS.map((r) => ({
            id: r.name,
            lat: r.lat,
            lng: r.lng,
            label: r.name,
            info: r.name,
            onClick: () => navigate(`/stays?region=${encodeURIComponent(r.query)}`),
          }))}
        />
      </section>
    </div>
  );
};

export default Index;
