import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChevronDown, Heart, List, Map as MapIcon, SlidersHorizontal, Star } from "lucide-react";
import StayCard from "@/components/StayCard";
import KakaoMap from "@/components/KakaoMap";
import { CATEGORIES, SORT_OPTIONS, type SortOption } from "@/data/stays";
import { getStays, type StayItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SORT_MAP: Record<SortOption, string> = {
  "인기순": "rating",
  "낮은가격순": "price_asc",
  "높은가격순": "price_desc",
  "평점순": "rating",
};

const Stays = () => {
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<string>("전체");
  const [sort, setSort] = useState<SortOption>("인기순");
  const [view, setView] = useState<"list" | "map">("list");
  const [stays, setStays] = useState<StayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const region = searchParams.get("region") || undefined;
  const search = searchParams.get("search") || undefined;

  useEffect(() => {
    setLoading(true);
    getStays({ category, region, search, sort: SORT_MAP[sort], limit: 100 })
      .then(setStays)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, sort, region, search]);

  const pageTitle = region || search || "전체";

  return (
    <div className="space-y-8">
      {/* Top filter bar */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 px-4 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground hover:border-foreground/60"
                )}
                style={{ borderRadius: "6px" }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            className="flex items-center gap-2 border border-foreground/80 px-4 py-2 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
            style={{ borderRadius: "6px" }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            필터
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground hover:border-foreground/60"
                style={{ borderRadius: "6px" }}
              >
                {sort}
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {SORT_OPTIONS.map((o) => (
                <DropdownMenuItem key={o} onClick={() => setSort(o)}>
                  {o}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="font-serif-display text-3xl">{pageTitle} 숙소</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "검색 중..." : `${stays.length}개 결과`}
          </p>
        </div>
        <button
          onClick={() => setView(view === "list" ? "map" : "list")}
          className="flex items-center gap-2 border border-foreground/80 px-4 py-2 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background"
          style={{ borderRadius: "6px" }}
        >
          {view === "list" ? <MapIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
          {view === "list" ? "지도보기" : "목록보기"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-muted" style={{ height: "180px" }} />
          ))}
        </div>
      ) : view === "list" ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {stays.map((s) => (
            <StayCard key={s.id} stay={s} imageHeight={180} />
          ))}
        </div>
      ) : (
        <MapView stays={stays} />
      )}
    </div>
  );
};

const MapView = ({ stays }: { stays: StayItem[] }) => {
  const [activeId, setActiveId] = useState<string | undefined>();
  const withCoords = stays.filter((s) => s.latitude && s.longitude);

  const center =
    withCoords.length > 0
      ? { lat: withCoords[0].latitude!, lng: withCoords[0].longitude! }
      : { lat: 36.5, lng: 127.8 };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="h-[600px]">
        <KakaoMap
          center={center}
          level={10}
          height="100%"
          activeId={activeId}
          markers={withCoords.map((s) => ({
            id: s.id,
            lat: s.latitude!,
            lng: s.longitude!,
            label: `₩${s.price.toLocaleString()}`,
            info: `${s.name} · ₩${s.price.toLocaleString()}`,
            onClick: () => setActiveId(s.id),
          }))}
        />
      </div>

      <div className="h-[600px] space-y-3 overflow-y-auto pr-2">
        {stays.map((s) => (
          <Link
            key={s.id}
            to={`/stays/${s.id}`}
            onMouseEnter={() => setActiveId(s.id)}
            className={cn(
              "flex gap-3 border p-3 transition-colors",
              activeId === s.id ? "border-foreground" : "border-border hover:border-foreground/40"
            )}
            style={{ borderRadius: "8px" }}
          >
            <div
              className="h-20 w-24 shrink-0"
              style={{
                background: s.image_url
                  ? `url(${s.image_url}) center/cover no-repeat`
                  : "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
                borderRadius: "6px",
              }}
            />
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] text-muted-foreground">{s.location}</div>
                <div className="truncate text-sm font-medium">{s.name}</div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-foreground" />
                  <span>{s.rating}</span>
                  <span className="text-muted-foreground">({s.reviews})</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">₩{s.price.toLocaleString()}</span>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Stays;
