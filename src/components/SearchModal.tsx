import { useEffect, useRef, useState } from "react";
import { SortField } from "../types";
import { useAppStore } from "../store";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  sortBy: SortField;
  onSortChange: (s: SortField) => void;
  totalCount: number;
  filteredCount: number;
  onClose: () => void;
}

const GENRE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "ボイス", label: "ボイス" },
  { value: "コミック", label: "コミック" },
  { value: "動画", label: "動画" },
  { value: "CG", label: "CG" },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "importedAt", label: "追加順" },
  { value: "title", label: "タイトル" },
  { value: "circle", label: "サークル" },
];

export function SearchModal({
  query,
  onQueryChange,
  selectedGenre,
  onGenreChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(query);
  const [showHistory, setShowHistory] = useState(false);

  const searchHistory = useAppStore((s) => s.searchHistory);
  const addToSearchHistory = useAppStore((s) => s.addToSearchHistory);
  const clearSearchHistory = useAppStore((s) => s.clearSearchHistory);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      setShowHistory(true);
    }, 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => onQueryChange(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue, onQueryChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputValue]);

  const handleClose = () => {
    if (inputValue.trim()) addToSearchHistory(inputValue.trim());
    onClose();
  };

  const handleHistorySelect = (item: string) => {
    onQueryChange(item);
    addToSearchHistory(item);
    onClose();
  };

  const isFiltered = query || selectedGenre;
  const historyVisible = showHistory && searchHistory.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-stretch"
      onClick={handleClose}
      style={{ touchAction: "none" }}
    >
      {/* パネル — 画面上部に固定 */}
      <div
        className="bg-[#1a1a2e] border-b border-white/10 px-4 pt-4 pb-4 space-y-3 shadow-2xl"
        style={{ paddingTop: "calc(1rem + env(safe-area-inset-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 検索入力 */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none select-none">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setShowHistory(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onQueryChange(inputValue);
                if (inputValue.trim()) addToSearchHistory(inputValue.trim());
                onClose();
              }
            }}
            placeholder="タイトル・サークル・声優で検索..."
            className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-10 py-3 outline-none focus:ring-2 focus:ring-violet-500"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(""); onQueryChange(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* カテゴリ絞り込み */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {GENRE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onGenreChange(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedGenre === opt.value
                  ? "bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ソート + 件数 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {isFiltered ? `${filteredCount} / ${totalCount}件` : `全${totalCount}件`}
          </span>
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === opt.value
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 背景タップで閉じる（履歴はこのエリアの先頭に表示） */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm">
        {historyVisible && (
          <div
            className="mx-3 mt-2 bg-[#1a1a2e]/95 rounded-xl border border-white/10 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">最近の検索</span>
              <button
                onClick={clearSearchHistory}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                クリア
              </button>
            </div>
            <div className="pb-1">
              {searchHistory.map((item) => (
                <button
                  key={item}
                  onClick={() => handleHistorySelect(item)}
                  className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-700/60 active:bg-slate-700 transition-colors flex items-center gap-2.5"
                >
                  <span className="text-slate-500 shrink-0 text-base">🕐</span>
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
