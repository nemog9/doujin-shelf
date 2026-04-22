interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function SearchBar({ query, onQueryChange, sortBy, onSortChange, totalCount, filteredCount }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-[#0f0f1a]/95 backdrop-blur border-b border-white/5 px-3 pt-2 pb-2 space-y-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="タイトル・サークル・声優で検索..."
          className="w-full bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {query ? `${filteredCount} / ${totalCount}件` : `全${totalCount}件`}
        </span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10"
        >
          <option value="importedAt">追加順</option>
          <option value="title">タイトル順</option>
          <option value="circle">サークル順</option>
        </select>
      </div>
    </div>
  );
}
