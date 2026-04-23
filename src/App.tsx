import { useCallback, useEffect, useMemo, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { confirm, open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore, getFilteredWorks } from "./store";
import { createWork, parseCSV } from "./utils/csvParser";
import { WorkCard } from "./components/WorkCard";
import { WorkModal } from "./components/WorkModal";
import { ImportStats } from "./components/ImportStats";
import { EmptyState } from "./components/EmptyState";
import { SearchFAB } from "./components/SearchFAB";
import { SearchModal } from "./components/SearchModal";
import { BottomNav, Tab } from "./components/BottomNav";
import { RandomView } from "./components/RandomView";
import { SettingsView } from "./components/SettingsView";
import { Work } from "./types";
import { SortField } from "./types";

declare global {
  interface Window {
    AppBridge?: {
      openUrl: (url: string) => void;
      startDmmScraper?: (existingTitlesJson?: string, keepAwake?: boolean) => void;
    };
    __onDmmScraped?: (items: DmmScrapedItem[]) => void;
  }
}

interface DmmScrapedItem {
  title?: string;
  circle?: string;
  actors?: string[];
  thumbnailUrl?: string;
  productUrl?: string;
}

export default function App() {
  const {
    works,
    favorites,
    searchQuery,
    sortBy,
    linkOpenMode,
    preventSleepDuringImport,
    lastImportResult,
    selectedWork,
    addWorks,
    removeWork,
    toggleFavorite,
    setSearchQuery,
    setSortBy,
    setLinkOpenMode,
    setPreventSleepDuringImport,
    selectWork,
    dismissImportResult,
  } = useAppStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [canImportFromDmm, setCanImportFromDmm] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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

      addWorks(parsed, filename, errors);
    } catch (err) {
      console.error("Import failed:", err);
    }
  }, [addWorks]);

  const handleDeleteWork = useCallback(async (work: Work) => {
    const confirmed = await confirm(`「${work.title}」を削除しますか？`, {
      title: "作品を削除",
      kind: "warning",
      okLabel: "削除する",
      cancelLabel: "キャンセル",
    });
    if (!confirmed) return;

    removeWork(work.id);
  }, [removeWork]);

  const handleDmmScraped = useCallback((items: DmmScrapedItem[]) => {
    const now = new Date().toISOString();
    const parsed = items
      .map((item) => createWork({
        title: item.title ?? "",
        circle: item.circle ?? "",
        actors: item.actors ?? [],
        thumbnailUrl: item.thumbnailUrl ?? "",
        productUrl: item.productUrl ?? "",
      }, now))
      .filter((work): work is Work => work !== null);

    addWorks(parsed, "Android DMMライブラリ", items.length - parsed.length);
  }, [addWorks]);

  const handleExport = useCallback(async () => {
    try {
      const now = new Date();
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        "-",
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
      ].join("");
      const filename = `voice-library-${stamp}.csv`;
      const header = '"タイトル","サークル名","声優","URL","サムネイル"';
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const lines = works.map((work) =>
        [
          escape(work.title),
          escape(work.circle),
          escape(work.actors.join(",")),
          escape(work.productUrl),
          escape(work.thumbnailUrl),
        ].join(",")
      );
      const csv = `\uFEFF${[header, ...lines].join("\n")}`;

      const targetPath = await saveDialog({
        defaultPath: filename,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (!targetPath) return;

      await writeTextFile(targetPath, csv);
      const savedName = targetPath.split(/[\\/]/).pop() ?? filename;
      setExportMessage(`${savedName} を保存しました`);
    } catch (error) {
      console.error("Export failed:", error);
      setExportMessage("CSVの保存に失敗しました");
    }
  }, [works]);

  const handleImportFromDmm = useCallback(() => {
    const existingTitlesJson = JSON.stringify(works.map((work) => work.title.trim()).filter(Boolean));
    window.AppBridge?.startDmmScraper?.(existingTitlesJson, preventSleepDuringImport);
  }, [preventSleepDuringImport, works]);

  useEffect(() => {
    setCanImportFromDmm(Boolean(isTauri() && window.AppBridge?.startDmmScraper));
  }, []);

  useEffect(() => {
    window.__onDmmScraped = handleDmmScraped;
    return () => {
      delete window.__onDmmScraped;
    };
  }, [handleDmmScraped]);

  const displayedWorks = activeTab === "favorites" ? favoriteWorks : filtered;
  const canExport = isTauri() && works.length > 0;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold text-slate-100 tracking-tight">
          🎵 音声作品ビューワー
        </h1>
        <div className="flex items-center gap-2">
          {canImportFromDmm && (
            <button
              onClick={handleImportFromDmm}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              DMM取得
            </button>
          )}
          <button
            onClick={handleImport}
            className="text-xs bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            ＋ CSV
          </button>
        </div>
      </header>

      {/* Import result banner */}
      {lastImportResult && (
        <ImportStats result={lastImportResult} onDismiss={dismissImportResult} />
      )}
      {exportMessage && (
        <div className="mx-3 mt-2 bg-slate-800/80 border border-sky-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-2xl mt-0.5">💾</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sky-300">CSVエクスポート</p>
            <p className="mt-1 text-xs text-slate-300">{exportMessage}</p>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-slate-500 hover:text-slate-300 text-sm shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Active search indicator */}
      {searchQuery && activeTab !== "random" && activeTab !== "settings" && (
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
      ) : activeTab === "settings" ? (
        <SettingsView
          linkOpenMode={linkOpenMode}
          onChangeLinkOpenMode={setLinkOpenMode}
          preventSleepDuringImport={preventSleepDuringImport}
          onChangePreventSleepDuringImport={setPreventSleepDuringImport}
          canExport={canExport}
          onExport={handleExport}
        />
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
            <EmptyState onImport={handleImport} onImportFromDmm={canImportFromDmm ? handleImportFromDmm : undefined} />
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
      {activeTab !== "random" && activeTab !== "settings" && (
        <SearchFAB
          onClick={() => setSearchOpen(true)}
          hasActiveQuery={!!searchQuery}
        />
      )}

      {/* Search modal */}
      {searchOpen && activeTab !== "settings" && (
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
          onDelete={async () => {
            await handleDeleteWork(selectedWork);
          }}
        />
      )}
    </div>
  );
}
