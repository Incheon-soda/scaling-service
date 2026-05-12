import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface StayCardData {
  id: string;
  name: string;
  location: string;
  tags: string[];
  rating: number;
  reviews: number;
  price: number;
  image_url?: string | null;
  image?: string;
  badge?: string | null;
}

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, hsl(200 30% 70%), hsl(210 40% 50%))",
  "linear-gradient(135deg, hsl(150 30% 65%), hsl(160 40% 45%))",
  "linear-gradient(135deg, hsl(30 40% 70%), hsl(20 50% 55%))",
  "linear-gradient(135deg, hsl(270 30% 70%), hsl(280 40% 50%))",
  "linear-gradient(135deg, hsl(0 30% 70%), hsl(10 40% 55%))",
];

const StayCard = ({ stay, imageHeight = 200 }: { stay: StayCardData; imageHeight?: number }) => {
  const [liked, setLiked] = useState(false);

  const idHash = stay.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bg = stay.image_url
    ? `url(${stay.image_url}) center/cover no-repeat`
    : stay.image
    ? stay.image
    : FALLBACK_GRADIENTS[idHash % FALLBACK_GRADIENTS.length];

  return (
    <Link to={`/stays/${stay.id}`} className="group block">
      <div className="relative overflow-hidden" style={{ borderRadius: "8px" }}>
        <div className="w-full" style={{ background: bg, height: `${imageHeight}px` }} />
        {stay.badge && (
          <span
            className="absolute left-3 top-3 bg-foreground px-2 py-1 text-[11px] font-medium text-background"
            style={{ borderRadius: "4px" }}
          >
            {stay.badge}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-background/80 backdrop-blur transition-colors hover:bg-background"
          style={{ borderRadius: "4px" }}
          aria-label="위시리스트"
        >
          <Heart
            className={cn("h-4 w-4", liked ? "fill-foreground text-foreground" : "text-foreground")}
          />
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="text-xs text-muted-foreground">{stay.location}</div>
        <h3 className="text-[15px] font-medium text-foreground">{stay.name}</h3>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {stay.tags.map((t) => (
            <span
              key={t}
              className="border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
              style={{ borderRadius: "4px" }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 pt-1 text-xs text-foreground">
          <Star className="h-3 w-3 fill-foreground" />
          <span className="font-medium">{stay.rating}</span>
          <span className="text-muted-foreground">({stay.reviews})</span>
        </div>

        <div className="pt-1 text-sm text-foreground">
          <span className="font-medium">₩{stay.price.toLocaleString()}</span>
          <span className="text-muted-foreground"> / 1박</span>
        </div>
      </div>
    </Link>
  );
};

export default StayCard;
