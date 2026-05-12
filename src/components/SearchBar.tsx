import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, Users, Search, Minus, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const Field = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex flex-1 items-center gap-3 px-5 py-3">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <div className="flex min-w-0 flex-col">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  </div>
);

const SearchBar = () => {
  const navigate = useNavigate();
  const [region, setRegion] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    navigate(`/stays${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div
      className="flex w-full items-stretch bg-background"
      style={{ border: "0.5px solid hsl(0 0% 80%)", borderRadius: "8px" }}
    >
      <Field label="지역" icon={MapPin}>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="어디로 가세요?"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </Field>

      <div style={{ borderLeft: "0.5px solid hsl(0 0% 88%)" }} />

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex flex-1 items-center text-left">
            <Field label="체크인" icon={CalendarIcon}>
              <span className={cn("text-sm", !checkIn && "text-muted-foreground")}>
                {checkIn ? format(checkIn, "yyyy.MM.dd (E)", { locale: ko }) : "날짜 추가"}
              </span>
            </Field>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={checkIn} onSelect={setCheckIn} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      <div style={{ borderLeft: "0.5px solid hsl(0 0% 88%)" }} />

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex flex-1 items-center text-left">
            <Field label="체크아웃" icon={CalendarIcon}>
              <span className={cn("text-sm", !checkOut && "text-muted-foreground")}>
                {checkOut ? format(checkOut, "yyyy.MM.dd (E)", { locale: ko }) : "날짜 추가"}
              </span>
            </Field>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={checkOut} onSelect={setCheckOut} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      <div style={{ borderLeft: "0.5px solid hsl(0 0% 88%)" }} />

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex flex-1 items-center text-left">
            <Field label="인원" icon={Users}>
              <span className="text-sm">
                성인 {adults}명{children > 0 && `, 아동 ${children}명`}
              </span>
            </Field>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <GuestRow label="성인" sub="만 13세 이상" value={adults} onChange={setAdults} min={1} />
          <div className="my-3" style={{ borderTop: "0.5px solid hsl(0 0% 88%)" }} />
          <GuestRow label="아동" sub="만 2~12세" value={children} onChange={setChildren} min={0} />
        </PopoverContent>
      </Popover>

      <div className="flex items-center pr-2">
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 bg-foreground px-5 py-3 text-sm text-background transition-opacity hover:opacity-90"
          style={{ borderRadius: "6px" }}
        >
          <Search className="h-4 w-4" />
          검색
        </button>
      </div>
    </div>
  );
};

const GuestRow = ({
  label,
  sub,
  value,
  onChange,
  min,
}: {
  label: string;
  sub: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
}) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center border border-foreground/30 text-foreground disabled:opacity-30"
        style={{ borderRadius: "4px" }}
        disabled={value <= min}
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-6 text-center text-sm">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center border border-foreground/30 text-foreground"
        style={{ borderRadius: "4px" }}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  </div>
);

export default SearchBar;
