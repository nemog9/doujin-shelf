import { useState } from "react";
import { Work } from "../types";
import { WorkCard } from "./WorkCard";

interface Props {
  works: Work[];
  onSelect: (work: Work) => void;
}

function pickRandom(works: Work[], exclude?: string): Work | null {
  if (works.length === 0) return null;
  if (works.length === 1) return works[0];
  const candidates = exclude ? works.filter((w) => w.id !== exclude) : works;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function RandomView({ works, onSelect }: Props) {
  const [current, setCurrent] = useState<Work | null>(() => pickRandom(works));

  const refresh = () => setCurrent(pickRandom(works, current?.id ?? undefined));

  if (works.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <span className="text-4xl">🎲</span>
        <p>作品がありません</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start gap-6 px-8 pt-6">
      {current && (
        <div className="w-full max-w-xs">
          <WorkCard work={current} onClick={() => onSelect(current)} isFavorite={false} onToggleFavorite={() => {}} />
        </div>
      )}
      <button
        onClick={refresh}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium px-6 py-3 rounded-2xl transition-colors text-sm"
      >
        <span className="text-base">🎲</span> 別の作品
      </button>
    </div>
  );
}
