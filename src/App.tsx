import { useCallback, useMemo, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore, getFilteredWorks } from "./store";
import { parseCSV } from "./utils/csvParser";
import { WorkCard } from "./components/WorkCard";
import { WorkModal } from "./components/WorkModal";
import { ImportStats } from "./components/ImportStats";
import { EmptyState } from "./components/EmptyState";
import { SearchFAB } from "./components/SearchFAB";
import { SearchModal } from "./components/SearchModal";
import { BottomNav, Tab } from "./components/BottomNav";
import { RandomView } from "./components/RandomView";
import { SortField } from "./types";

export default function App() {
  const {
    works,
    favorites,
    searchQuery,
    sortBy,
    lastImportResult,
    selectedWork,
    addWorks,
    toggleFavorite,
    setSearchQuery,
    setSortBy,
    selectWork,
    dismissImportResult,
  } = useAppStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("list");

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const filtered = useMemo(
    () => getFilteredWorks(works, searchQuery, sortBy),
    [works, searchQuery, sortBy]
  );

  const favoriteWorks = useMemo(
    () => getFilteredWorks(works.filter((w) => favorites.includes(w.id)), searchQuery, sortBy),
    [works, favorites, searchQuery, sortBy]
  );

  const handleImport = useCallback(async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        filters: [{ name: "CSV", extensions: ["csv", "txt"] }],
      });
      if (!selected || typeof selected !== "string") return;

      const content = await readTextFile(selected);
      const filename = selected.split(/[\\/]/).pop() ?? selected;
      const { works: parsed, errors } = parseCSV(content);

      const result = addWorks(parsed, filename);
      result.errors += errors;
    } catch (err) {
      console.error("Import failed:", err);
    }
  }, [addWorks]);

  const displayedWorks = activeTab === "favorites" ? favoriteWorks : filtered;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold text-slate-100 tracking-tight">
          🎵 音声作品ビューワー
        </h1>
        <button
          onClick={handleImport}
          className="text-xs bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          ＋ CSV
        </button>
      </header>

      {/* Import result banner */}
      {lastImportResult && (
        <ImportStats result={lastImportResult} onDismiss={dismissImportResult} />
      )}

      {/* Active search indicator */}
      {searchQuery && activeTab !== "random" && (
        <div className="px-3 py-1.5 flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">
            「{searchQuery}」— {displayedWorks.length}件
          </span>
          <button
            onClick={() => setSearchQuery("")}
            className="text-[11px] text-violet-400 hover:underline"
          >
            クリア
          </button>
        </div>
      )}

      {/* Main content */}
      {activeTab === "random" ? (
        <RandomView works={works} onSelect={selectWork} />
      ) : (
        <main
          className="flex-1 overflow-y-auto scrollbar-hide"
          style={{
            WebkitOverflowScrolling: "touch",
            transform: "translateZ(0)",
            willChange: "scroll-position",
          }}
        >
          {works.length === 0 ? (
            <EmptyState onImport={handleImport} />
          ) : activeTab === "favorites" && favoriteWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
              <span className="text-4xl">♡</span>
              <p>お気に入りがありません</p>
              <p className="text-xs text-slate-500">作品カードの♡をタップして追加</p>
            </div>
          ) : displayedWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
              <p>「{searchQuery}」に一致する作品がありません</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-violet-400 text-xs hover:underline"
              >
                検索をクリア
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3 pb-24">
              {displayedWorks.map((work) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  onClick={() => selectWork(work)}
                  isFavorite={favorites.includes(work.id)}
                  onToggleFavorite={() => toggleFavorite(work.id)}
                />
              ))}
            </div>
          )}
        </main>
      )}

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onChange={handleTabChange}
        favoritesCount={favorites.length}
      />

      {/* Search FAB — only on list/favorites tabs */}
      {activeTab !== "random" && (
        <SearchFAB
          onClick={() => setSearchOpen(true)}
          hasActiveQuery={!!searchQuery}
        />
      )}

      {/* Search modal */}
      {searchOpen && (
        <SearchModal
          query={searchQuery}
          onQueryChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={(s) => setSortBy(s as SortField)}
          totalCount={activeTab === "favorites" ? favorites.length : works.length}
          filteredCount={displayedWorks.length}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* Work detail modal */}
      {selectedWork && (
        <WorkModal
          work={selectedWork}
          onClose={() => selectWork(null)}
          onFilterBy={(q) => { setSearchQuery(q); selectWork(null); setActiveTab("list"); }}
        />
      )}
    </div>
  );
}
