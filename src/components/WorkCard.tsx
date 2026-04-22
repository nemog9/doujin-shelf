import { useState } from "react";
import { Work } from "../types";

interface Props {
  work: Work;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const SOURCE_LABEL: Record<Work["source"], string> = {
  dmm: "DMM",
  dlsite: "DL",
  other: "",
};

export function WorkCard({ work, onClick, isFavorite, onToggleFavorite }: Props) {
  const [imgError, setImgError] = useState(false);
  const badge = SOURCE_LABEL[work.source];

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col bg-slate-800/60 rounded-xl overflow-hidden border border-white/5 active:scale-95 transition-transform duration-150 text-left"
      style={{ transform: "translateZ(0)" }}
    >
      {/* Thumbnail */}
      <div className="aspect-square w-full bg-slate-700 overflow-hidden relative">
        {!imgError && work.thumbnailUrl ? (
          <img
            src={work.thumbnailUrl}
            alt={work.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">
            🎵
          </div>
        )}
        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-base transition-colors ${
            isFavorite ? "text-pink-400" : "text-slate-400"
          }`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {/* Source badge */}
      {badge && (
        <span className="absolute top-1.5 left-1.5 text-[10px] font-bold bg-black/60 backdrop-blur-sm text-slate-300 px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-medium text-slate-100 line-clamp-2 leading-tight">{work.title}</p>
        <p className="text-[11px] text-slate-400 truncate">{work.circle}</p>
        {work.actors.length > 0 && (
          <p className="text-[11px] text-violet-300 truncate">{work.actors.join(" / ")}</p>
        )}
      </div>
    </button>
  );
}
