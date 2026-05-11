import { useMemo, useState } from "react";
import { Work } from "../types";

interface Props {
  works: Work[];
  onSelect: (work: Work) => void;
}

const GENRE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "ボイス", label: "ボイス" },
  { value: "コミック", label: "コミック" },
  { value: "動画", label: "動画" },
  { value: "CG", label: "CG" },
];

function pickRandom(pool: Work[], exclude?: string): Work | null {
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  const candidates = exclude ? pool.filter((w) => w.id !== exclude) : pool;
  if (candidates.length === 0) return pool[0];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function RandomView({ works, onSelect }: Props) {
  const [selectedGenre, setSelectedGenre] = useState("");
  const [current, setCurrent] = useState<Work | null>(null);
  const [imgError, setImgError] = useState(false);

  const pool = useMemo(() => {
    const visible = works.filter((w) => !w.hidden);
    if (!selectedGenre) return visible;
    const genreFiltered = visible.filter((w) => w.genre === selectedGenre);
    return genreFiltered.length > 0 ? genreFiltered : visible.filter((w) => !w.genre);
  }, [works, selectedGenre]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setImgError(false);
    setCurrent(null);
  };

  const refresh = () => {
    setImgError(false);
    setCurrent(pickRandom(pool, current?.id ?? undefined));
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
    <div className="flex-1 flex flex-col px-6 pt-4 pb-4">
      {/* カテゴリ絞り込み */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-3 shrink-0">
        {GENRE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleGenreChange(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              selectedGenre === opt.value
                ? "bg-sky-600 text-white"
                : "bg-slate-800 text-slate-400 active:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* カード — 残りスペースを使いつつ溢れない */}
      <div className="flex-1 flex items-start justify-center overflow-hidden pb-4">
        {current ? (
          <button
            onClick={() => onSelect(current)}
            className="w-full max-w-sm flex flex-col bg-slate-800/60 rounded-2xl overflow-hidden border border-white/5 active:scale-95 transition-transform duration-150 text-left"
          >
            {/* サムネイル — 全体表示・最大高さ制限 */}
            <div className="w-full bg-slate-900 flex items-center justify-center">
              {!imgError && current.thumbnailUrl ? (
                <img
                  src={current.thumbnailUrl}
                  alt={current.title}
                  className="w-full max-h-[52vw] object-contain"
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2">
            <span className="text-5xl">🎲</span>
            <p>ボタンを押してランダムに選択</p>
          </div>
        )}
      </div>

      {/* ボタン — 常に下部に固定（BottomNav分の余白を確保） */}
      <div className="flex justify-center" style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom))" }}>
        <button
          onClick={refresh}
          disabled={pool.length === 0}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-40 text-white font-medium px-6 py-3 rounded-2xl transition-colors text-sm"
        >
          <span className="text-base">🎲</span>
          {current ? "別の作品" : "ランダムに選ぶ"}
        </button>
      </div>
    </div>
  );
}
