import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Work, ImportResult, SortField, LinkOpenMode } from "./types";

interface AppState {
  works: Work[];
  favorites: string[];
  searchQuery: string;
  selectedGenre: string;
  sortBy: SortField;
  linkOpenMode: LinkOpenMode;
  preventSleepDuringImport: boolean;
  fullScanMode: boolean;
  lastImportResult: ImportResult | null;
  selectedWork: Work | null;

  addWorks: (incoming: Work[], filename: string, errors?: number) => ImportResult;
  removeWork: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setSelectedGenre: (genre: string) => void;
  setSortBy: (s: SortField) => void;
  setLinkOpenMode: (mode: LinkOpenMode) => void;
  setPreventSleepDuringImport: (enabled: boolean) => void;
  setFullScanMode: (enabled: boolean) => void;
  selectWork: (work: Work | null) => void;
  dismissImportResult: () => void;
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      works: [],
      favorites: [],
      searchQuery: "",
      selectedGenre: "",
      sortBy: "importedAt",
      linkOpenMode: "external",
      preventSleepDuringImport: true,
      fullScanMode: false,
      lastImportResult: null,
      selectedWork: null,

      addWorks: (incoming, filename, errors = 0) => {
        const existing = get().works;
        const existingIds = new Set(existing.map((w) => w.id));
        const added = incoming.filter((w) => !existingIds.has(w.id));
        const duplicates = incoming.length - added.length;

        const result: ImportResult = {
          added: added.length,
          duplicates,
          errors,
          total: incoming.length,
          filename,
        };

        set({ works: [...existing, ...added], lastImportResult: result });
        return result;
      },

      removeWork: (id) => {
        const works = get().works.filter((work) => work.id !== id);
        const favorites = get().favorites.filter((favoriteId) => favoriteId !== id);
        const selectedWork = get().selectedWork?.id === id ? null : get().selectedWork;
        set({ works, favorites, selectedWork });
      },

      toggleFavorite: (id) => {
        const favs = get().favorites;
        set({ favorites: favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id] });
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedGenre: (selectedGenre) => set({ selectedGenre }),
      setSortBy: (sortBy) => set({ sortBy }),
      setLinkOpenMode: (linkOpenMode) => set({ linkOpenMode }),
      setPreventSleepDuringImport: (preventSleepDuringImport) => set({ preventSleepDuringImport }),
      setFullScanMode: (fullScanMode) => set({ fullScanMode }),
      selectWork: (selectedWork) => set({ selectedWork }),
      dismissImportResult: () => set({ lastImportResult: null }),
      clearAll: () => set({ works: [], favorites: [], selectedWork: null, lastImportResult: null }),
    }),
    {
      name: "doujin-shelf",
      partialize: (state) => ({
        works: state.works,
        favorites: state.favorites,
        linkOpenMode: state.linkOpenMode,
        preventSleepDuringImport: state.preventSleepDuringImport,
        fullScanMode: state.fullScanMode,
      }),
    }
  )
);

// Derived: filtered + sorted works
export function getFilteredWorks(
  works: Work[],
  query: string,
  sortBy: SortField,
  genre = ""
): Work[] {
  const q = query.trim().toLowerCase();
  let filtered = works;

  if (genre) {
    filtered = filtered.filter((w) => w.genre === genre);
  }

  if (q) {
    filtered = filtered.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.circle.toLowerCase().includes(q) ||
        w.actors.some((a) => a.toLowerCase().includes(q))
    );
  }

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title, "ja");
      case "circle":
        return a.circle.localeCompare(b.circle, "ja");
      case "importedAt":
      default:
        return b.importedAt.localeCompare(a.importedAt);
    }
  });
}
