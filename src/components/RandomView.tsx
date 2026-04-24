import { useState } from "react";
import { Work } from "../types";

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
  const [imgError, setImgError] = useState(false);

  const refresh = () => {
    setImgError(false);
    setCurrent(pickRandom(works, current?.id ?? undefined));
  };

  if (works.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <span className="text-4xl">🎲</span>
        <p>作品がありません</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start gap-5 px-6 pt-4 pb-4">
      {current && (
        <button
          onClick={() => onSelect(current)}
          className="w-full max-w-sm flex flex-col bg-slate-800/60 rounded-2xl overflow-hidden border border-white/5 active:scale-95 transition-transform duration-150 text-left"
        >
          {/* サムネイル — 全体表示・最大高さ制限 */}
          <div className="w-full bg-slate-900 flex items-center justify-center" style={{ maxHeight: "60vw" }}>
            {!imgError && current.thumbnailUrl ? (
              <img
                src={current.thumbnailUrl}
                alt={current.title}
                className="w-full max-h-[60vw] object-contain"
                onError={() => setImgError(true)}
                decoding="async"
              />
            ) : (
              <div className="w-full h-40 flex items-center justify-center text-5xl text-slate-600">
                🎵
              </div>
            )}
          </div>

          {/* 作品情報 */}
          <div className="px-4 py-3 space-y-1">
            <p className="text-sm font-semibold text-slate-100 leading-snug">{current.title}</p>
            {current.circle && (
              <p className="text-xs text-slate-400">{current.circle}</p>
            )}
            {current.actors.length > 0 && (
              <p className="text-xs text-violet-300">{current.actors.join(" / ")}</p>
            )}
          </div>
        </button>
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
