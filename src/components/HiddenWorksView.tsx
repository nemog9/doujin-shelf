import { memo, useState } from "react";
import { Work } from "../types";

interface Props {
  works: Work[];
  onUnhide: (id: string) => void;
  onBack: () => void;
}

const HiddenWorkCard = memo(function HiddenWorkCard({
  work,
  onUnhide,
}: {
  work: Work;
  onUnhide: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="relative flex flex-col bg-slate-800/60 rounded-xl overflow-hidden border border-white/5 text-left">
      <div className="aspect-square w-full bg-slate-700 overflow-hidden">
        {!imgError && work.thumbnailUrl ? (
          <img
            src={work.thumbnailUrl}
            alt={work.title}
            className="w-full h-full object-cover opacity-50"
            onError={() => setImgError(true)}
            decoding="async"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">
            🎵
          </div>
        )}
      </div>
      <div className="p-2 space-y-1.5">
        <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-tight">{work.title}</p>
        <p className="text-[11px] text-slate-500 truncate">{work.circle}</p>
        <button
          onClick={onUnhide}
          className="w-full text-[11px] font-medium text-violet-400 hover:text-violet-300 active:opacity-70 bg-violet-900/30 hover:bg-violet-900/50 rounded-lg py-1.5 transition-colors"
        >
          表示に戻す
        </button>
      </div>
    </div>
  );
});

export function HiddenWorksView({ works, onUnhide, onBack }: Props) {
  return (
    <main className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 active:opacity-70 transition-colors p-1 -ml-1"
        >
          ← 設定に戻る
        </button>
      </div>
      <div className="px-4 pb-2">
        <h2 className="text-sm font-semibold text-slate-100">非表示にした作品</h2>
        <p className="text-xs text-slate-400 mt-0.5">{works.length}件</p>
      </div>
      {works.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
          <span className="text-4xl">👁</span>
          <p>非表示にした作品はありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3 pb-28">
          {works.map((work) => (
            <HiddenWorkCard key={work.id} work={work} onUnhide={() => onUnhide(work.id)} />
          ))}
        </div>
      )}
    </main>
  );
}
