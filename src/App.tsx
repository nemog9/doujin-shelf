import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
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
import { HiddenWorksView } from "./components/HiddenWorksView";
import { Work } from "./types";
import { SortField } from "./types";

const BATCH_SIZE = 40;

declare global {
  interface Window {
    __onDmmScraped?: (items: DmmScrapedItem[]) => void;
  }
}

interface DmmScrapedItem {
  title?: string;
  circle?: string;
  actors?: string[];
  thumbnailUrl?: string;
  productUrl?: string;
  genre?: string;
}

export default function App() {
  const {
    works,
    favorites,
    searchQuery,
    selectedGenre,
    sortBy,
    linkOpenMode,
    preventSleepDuringImport,
    fullScanMode,
    lastImportResult,
    selectedWork,
    addWorks,
    hideWork,
    unhideWork,
    setSearchQuery,
    setSelectedGenre,
    setSortBy,
    setLinkOpenMode,
    setPreventSleepDuringImport,
    setFullScanMode,
    selectWork,
    dismissImportResult,
    clearAll,
  } = useAppStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [canImportFromDmm, setCanImportFromDmm] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [favQuery, setFavQuery] = useState("");
  const [favGenre, setFavGenre] = useState("");
  const [showHiddenWorks, setShowHiddenWorks] = useState(false);

  // ── ナビゲーション履歴（一覧タブの検索状態 + スクロール位置） ──────────────
  interface NavEntry { query: string; genre: string; scrollTop: number }
  const navStackRef = useRef<NavEntry[]>([]);
  const mainScrollRef = useRef<HTMLElement>(null);
  const preSearchStateRef = useRef<{ query: string; genre: string } | null>(null);

  const pushNavState = useCallback(() => {
    const { searchQuery: q, selectedGenre: g } = useAppStore.getState();
    navStackRef.current.push({ query: q, genre: g, scrollTop: mainScrollRef.current?.scrollTop ?? 0 });
  }, []);

  const popNavState = useCallback(() => {
    const prev = navStackRef.current.pop();
    if (!prev) return false;
    setSearchQuery(prev.query);
    setSelectedGenre(prev.genre);
    requestAnimationFrame(() => {
      if (mainScrollRef.current) mainScrollRef.current.scrollTop = prev.scrollTop;
    });
    return true;
  }, [setSearchQuery, setSelectedGenre]);

  const handleTabChange = (tab: Tab) => {
    if (tab === "list" && activeTab === "list" && (searchQuery || selectedGenre)) {
      if (!popNavState()) {
        setSearchQuery("");
        setSelectedGenre("");
        navStackRef.current = [];
      }
      setActiveTab(tab);
      setShowHiddenWorks(false);
      return;
    }
    if (tab !== activeTab) setDisplayLimit(BATCH_SIZE);
    if (tab !== "list") navStackRef.current = [];
    setActiveTab(tab);
    if (tab !== "settings") setShowHiddenWorks(false);
  };

  const handleSearchOpen = useCallback(() => {
    const { searchQuery: q, selectedGenre: g } = useAppStore.getState();
    preSearchStateRef.current = { query: q, genre: g };
    setSearchOpen(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    const pre = preSearchStateRef.current;
    if (pre) {
      const { searchQuery: q, selectedGenre: g } = useAppStore.getState();
      if (q !== pre.query || g !== pre.genre) {
        navStackRef.current.push({ ...pre, scrollTop: mainScrollRef.current?.scrollTop ?? 0 });
      }
    }
    preSearchStateRef.current = null;
    setSearchOpen(false);
  }, []);

  // タブごとに独立した検索状態
  const currentQuery  = activeTab === "favorites" ? favQuery  : searchQuery;
  const currentGenre  = activeTab === "favorites" ? favGenre  : selectedGenre;
  const currentSetQuery = activeTab === "favorites" ? setFavQuery  : setSearchQuery;
  const currentSetGenre = activeTab === "favorites" ? setFavGenre  : setSelectedGenre;

  const filtered = useMemo(
    () => getFilteredWorks(works, searchQuery, sortBy, selectedGenre),
    [works, searchQuery, sortBy, selectedGenre]
  );

  const favoriteWorks = useMemo(
    () => getFilteredWorks(works.filter((w) => favorites.includes(w.id)), favQuery, sortBy, favGenre),
    [works, favorites, favQuery, sortBy, favGenre]
  );

  const hiddenWorks = useMemo(
    () => works.filter((w) => w.hidden),
    [works]
  );

  const handleImport = useCallback(async () => {
    try {
      if (window.AppBridge?.openCsvWithPicker) {
        // Android: SAF 経由で content:// URI を直接読み取る（Google Drive 対応）
        await new Promise<void>((resolve) => {
          (window as any).__onCsvOpened = (content: string | null) => {
            delete (window as any).__onCsvOpened;
            if (!content || content.startsWith("error:")) return resolve();
            const { works: parsed, errors, favoriteIds } = parseCSV(content);
            addWorks(parsed, "import.csv", errors, favoriteIds);
            resolve();
          };
          window.AppBridge!.openCsvWithPicker!();
        });
      } else {
        const selected = await openDialog({
          multiple: false,
          directory: false,
          filters: [{ name: "CSV", extensions: ["csv", "txt"] }],
        });
        if (!selected || typeof selected !== "string") return;

        const content = await readTextFile(selected);
        const filename = selected.split(/[\\/]/).pop() ?? selected;
        const { works: parsed, errors, favoriteIds } = parseCSV(content);
        addWorks(parsed, filename, errors, favoriteIds);
      }
    } catch (err) {
      console.error("Import failed:", err);
    }
  }, [addWorks]);

  const handleHideWork = useCallback((work: Work) => {
    hideWork(work.id);
  }, [hideWork]);

  const handleDmmScraped = useCallback((items: DmmScrapedItem[]) => {
    const now = new Date().toISOString();
    const parsed = items
      .map((item) => createWork({
        title: item.title ?? "",
        circle: item.circle ?? "",
        actors: item.actors ?? [],
        thumbnailUrl: item.thumbnailUrl ?? "",
        productUrl: item.productUrl ?? "",
        genre: item.genre ?? "",
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
      const header = '"タイトル","サークル名","声優","ジャンル","URL","サムネイル","お気に入り","非表示"';
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const lines = works.map((work) =>
        [
          escape(work.title),
          escape(work.circle),
          escape(work.actors.join(",")),
          escape(work.genre),
          escape(work.productUrl),
          escape(work.thumbnailUrl),
          favorites.includes(work.id) ? "○" : "",
          work.hidden ? "○" : "",
        ].join(",")
      );
      const csv = `\uFEFF${[header, ...lines].join("\n")}`;

      // Android: AppBridge が SAF ピッカーを開いてその場で書き込む
      if ("AppBridge" in window) {
        const saved = await new Promise<boolean>((resolve, reject) => {
          (window as any).__onCsvSaved = (result: string | null) => {
            delete (window as any).__onCsvSaved;
            if (result === null) return resolve(false); // user cancelled
            if (result === "ok") return resolve(true);
            reject(new Error(result));
          };
          (window as any).AppBridge.saveCsvWithPicker(csv, filename);
        });
        if (saved) setExportMessage(`${filename} を保存しました`);
        return;
      }

      // Desktop: saveDialog + writeTextFile
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

  const handleDeleteAll = useCallback(async () => {
    const first = await confirm("ライブラリのすべての作品とお気に入りを削除します。よろしいですか？", {
      title: "データを削除",
      kind: "warning",
      okLabel: "削除する",
      cancelLabel: "キャンセル",
    });
    if (!first) return;

    const second = await confirm("本当に削除しますか？この操作は元に戻せません。", {
      title: "最終確認",
      kind: "warning",
      okLabel: "すべて削除する",
      cancelLabel: "キャンセル",
    });
    if (!second) return;

    clearAll();
  }, [clearAll]);

  const handleImportFromDmm = useCallback(() => {
    const existingTitlesJson = JSON.stringify(works.map((work) => work.title.trim()).filter(Boolean));
    window.AppBridge?.startDmmScraper?.(existingTitlesJson, preventSleepDuringImport, fullScanMode);
  }, [preventSleepDuringImport, fullScanMode, works]);

  useEffect(() => {
    setCanImportFromDmm(Boolean(isTauri() && window.AppBridge?.startDmmScraper));
  }, []);

  useEffect(() => {
    window.__onDmmScraped = handleDmmScraped;
    return () => {
      delete window.__onDmmScraped;
    };
  }, [handleDmmScraped]);

  // Android back gesture / browser back ボタンの横取り
  const backHandlerRef = useRef<() => void>(() => {});
  useEffect(() => {
    backHandlerRef.current = () => {
      if (searchOpen) {
        handleSearchClose();
        history.pushState({ _appNav: true }, "");
        return;
      }
      if (selectedWork) {
        selectWork(null);
        history.pushState({ _appNav: true }, "");
        return;
      }
      if (activeTab === "list" && navStackRef.current.length > 0) {
        popNavState();
        history.pushState({ _appNav: true }, "");
        return;
      }
      // 何もなければ Android に戻る操作を委ねる（アプリ最小化）
    };
  }, [searchOpen, selectedWork, activeTab, handleSearchClose, popNavState, selectWork]);

  useEffect(() => {
    history.pushState({ _appNav: true }, "");
    const handler = () => backHandlerRef.current();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const displayedWorks = activeTab === "favorites" ? favoriteWorks : filtered;
  const deferredWorks = useDeferredValue(displayedWorks);
  const isListUpdating = deferredWorks !== displayedWorks;

  const [displayLimit, setDisplayLimit] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleWorks = deferredWorks.slice(0, displayLimit);
  const hasMore = displayLimit < deferredWorks.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = mainScrollRef.current;
    if (!sentinel || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setDisplayLimit((prev) => prev + BATCH_SIZE); },
      { root, rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, deferredWorks]);

  const canExport = isTauri() && works.length > 0;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold text-slate-100 tracking-tight">
          📚 DoujinShelf
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
      {(currentQuery || currentGenre) && activeTab !== "random" && activeTab !== "settings" && (
        <div className="px-3 py-1.5 flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400">
            {[currentQuery && `「${currentQuery}」`, currentGenre && `[${currentGenre}]`].filter(Boolean).join(" ")} — {displayedWorks.length}件
          </span>
          <button
            onClick={() => { currentSetQuery(""); currentSetGenre(""); }}
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
        showHiddenWorks ? (
          <HiddenWorksView
            works={hiddenWorks}
            onUnhide={unhideWork}
            onBack={() => setShowHiddenWorks(false)}
          />
        ) : (
          <SettingsView
            linkOpenMode={linkOpenMode}
            onChangeLinkOpenMode={setLinkOpenMode}
            preventSleepDuringImport={preventSleepDuringImport}
            onChangePreventSleepDuringImport={setPreventSleepDuringImport}
            fullScanMode={fullScanMode}
            onChangeFullScanMode={setFullScanMode}
            canExport={canExport}
            onExport={handleExport}
            onDeleteAll={handleDeleteAll}
            hiddenCount={hiddenWorks.length}
            onShowHidden={() => setShowHiddenWorks(true)}
          />
        )
      ) : (
        <main
          ref={mainScrollRef as React.RefObject<HTMLElement>}
          className={`flex-1 scrollbar-hide ${searchOpen || !!selectedWork ? "overflow-hidden" : "overflow-y-auto"}`}
          style={{
            WebkitOverflowScrolling: "touch",
            transform: "translateZ(0)",
            willChange: "scroll-position",
          }}
        >
          {works.length === 0 ? (
            <EmptyState onImport={handleImport} onImportFromDmm={canImportFromDmm ? handleImportFromDmm : undefined} />
          ) : activeTab === "favorites" && favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm gap-2">
              <span className="text-4xl">♡</span>
              <p>お気に入りがありません</p>
              <p className="text-xs text-slate-500">作品カードの♡をタップして追加</p>
            </div>
          ) : displayedWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
              <p>条件に一致する作品がありません</p>
              <button
                onClick={() => { currentSetQuery(""); currentSetGenre(""); }}
                className="mt-2 text-violet-400 text-xs hover:underline"
              >
                検索をクリア
              </button>
            </div>
          ) : (
            <div className="relative">
              {isListUpdating && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-16 pointer-events-none">
                  <div className="bg-slate-900/80 rounded-full px-4 py-2 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span className="text-xs text-slate-300">読み込み中</span>
                  </div>
                </div>
              )}
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-3 transition-opacity duration-150 ${isListUpdating ? "opacity-50" : "opacity-100"}`}
                style={{ paddingBottom: `calc(${(currentQuery || currentGenre) ? "9rem" : "7rem"} + env(safe-area-inset-bottom))` }}
              >
                {visibleWorks.map((work) => (
                  <WorkCard key={work.id} work={work} />
                ))}
                {hasMore && <div ref={sentinelRef} className="col-span-full h-1" />}
              </div>
            </div>
          )}
        </main>
      )}

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* Search FAB — only on list/favorites tabs */}
      {activeTab !== "random" && activeTab !== "settings" && (
        <SearchFAB
          onClick={handleSearchOpen}
          hasActiveQuery={!!(currentQuery || currentGenre)}
        />
      )}

      {/* Search modal */}
      {searchOpen && activeTab !== "settings" && (
        <SearchModal
          query={currentQuery}
          onQueryChange={currentSetQuery}
          selectedGenre={currentGenre}
          onGenreChange={currentSetGenre}
          sortBy={sortBy}
          onSortChange={(s) => setSortBy(s as SortField)}
          totalCount={activeTab === "favorites" ? favorites.length : works.length}
          filteredCount={displayedWorks.length}
          onClose={handleSearchClose}
        />
      )}

      {/* Work detail modal */}
      {selectedWork && (
        <WorkModal
          work={selectedWork}
          onClose={() => selectWork(null)}
          onFilterBy={(q) => { pushNavState(); setSearchQuery(q); selectWork(null); setActiveTab("list"); }}
          onHide={() => handleHideWork(selectedWork)}
        />
      )}
    </div>
  );
}
