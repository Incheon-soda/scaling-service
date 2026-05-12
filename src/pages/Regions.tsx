import { useNavigate } from "react-router-dom";
import KakaoMap from "@/components/KakaoMap";

type Region = {
  name: string;
  lat: number;
  lng: number;
  count: number;
  bg: string;
};

const REGIONS: Region[] = [
  { name: "서울", lat: 37.5665, lng: 126.978, count: 1240, bg: "linear-gradient(135deg, hsl(220 25% 75%), hsl(230 30% 50%))" },
  { name: "제주", lat: 33.4996, lng: 126.5312, count: 287, bg: "linear-gradient(135deg, hsl(180 30% 70%), hsl(195 40% 45%))" },
  { name: "부산", lat: 35.1796, lng: 129.0756, count: 431, bg: "linear-gradient(135deg, hsl(200 35% 70%), hsl(210 45% 45%))" },
  { name: "강원", lat: 37.8228, lng: 128.1555, count: 356, bg: "linear-gradient(135deg, hsl(150 25% 70%), hsl(170 30% 40%))" },
  { name: "경주", lat: 35.8562, lng: 129.2247, count: 198, bg: "linear-gradient(135deg, hsl(30 30% 72%), hsl(20 40% 45%))" },
  { name: "여수", lat: 34.7604, lng: 127.6622, count: 164, bg: "linear-gradient(135deg, hsl(190 30% 72%), hsl(205 40% 45%))" },
  { name: "전주", lat: 35.8242, lng: 127.148, count: 142, bg: "linear-gradient(135deg, hsl(40 35% 72%), hsl(30 40% 45%))" },
  { name: "속초", lat: 38.207, lng: 128.5918, count: 223, bg: "linear-gradient(135deg, hsl(210 30% 72%), hsl(220 40% 45%))" },
];

const Regions = () => {
  const navigate = useNavigate();

  const scrollToRegion = (name: string) => {
    const el = document.getElementById(`region-${name}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="font-serif-display text-4xl md:text-5xl">지역별 숙소</h1>
        <p className="text-sm text-muted-foreground">원하는 지역을 선택하세요</p>
      </section>

      <section>
        <KakaoMap
          center={{ lat: 36.5, lng: 127.8 }}
          level={13}
          height={350}
          markers={REGIONS.map((r) => ({
            id: r.name,
            lat: r.lat,
            lng: r.lng,
            label: `${r.name} ${r.count.toLocaleString()}`,
            onClick: () => scrollToRegion(r.name),
          }))}
        />
      </section>

      <section className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {REGIONS.map((r) => (
          <button
            key={r.name}
            id={`region-${r.name}`}
            onClick={() => navigate(`/stays?region=${encodeURIComponent(r.name)}`)}
            className="group flex flex-col gap-3 text-left"
          >
            <div
              className="w-full transition-colors"
              style={{
                height: "160px",
                background: r.bg,
                border: "0.5px solid hsl(0 0% 80%)",
                borderRadius: "8px",
              }}
            />
            <div className="space-y-1 px-0.5">
              <div className="font-serif-display text-xl transition-colors group-hover:text-foreground">
                {r.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.count.toLocaleString()}개 숙소
              </div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
};

export default Regions;
