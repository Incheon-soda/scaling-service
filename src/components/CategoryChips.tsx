import { CATEGORIES } from "@/data/stays";
import { cn } from "@/lib/utils";

type Props = {
  active: string;
  onChange: (c: string) => void;
};

const CategoryChips = ({ active, onChange }: Props) => {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const isActive = active === c;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              "px-4 py-2 text-sm transition-colors",
              isActive
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
  );
};

export default CategoryChips;
