import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Work, ImportResult, SortField, LinkOpenMode } from "./types";

interface AppState {
  works: Work[];
  favorites: string[];
  searchQuery: string;
  sortBy: SortField;
  linkOpenMode: LinkOpenMode;
  lastImportResult: ImportResult | null;
  selectedWork: Work | null;

  addWorks: (incoming: Work[], filename: string) => ImportResult;
  toggleFavorite: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: SortField) => void;
  setLinkOpenMode: (mode: LinkOpenMode) => void;
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
      sortBy: "importedAt",
      linkOpenMode: "external",
      lastImportResult: null,
      selectedWork: null,

      addWorks: (incoming, filename) => {
        const existing = get().works;
        const existingIds = new Set(existing.map((w) => w.id));
        const added = incoming.filter((w) => !existingIds.has(w.id));
        const duplicates = incoming.length - added.length;

        const result: ImportResult = {
          added: added.length,
          duplicates,
          errors: 0,
          total: incoming.length,
          filename,
        };

        set({ works: [...existing, ...added], lastImportResult: result });
        return result;
      },

      toggleFavorite: (id) => {
        const favs = get().favorites;
        set({ favorites: favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id] });
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortBy: (sortBy) => set({ sortBy }),
      setLinkOpenMode: (linkOpenMode) => set({ linkOpenMode }),
      selectWork: (selectedWork) => set({ selectedWork }),
      dismissImportResult: () => set({ lastImportResult: null }),
      clearAll: () => set({ works: [], lastImportResult: null }),
    }),
    {
      name: "voice-csv-viewer",
      partialize: (state) => ({
        works: state.works,
        favorites: state.favorites,
        linkOpenMode: state.linkOpenMode,
      }),
    }
  )
);

// Derived: filtered + sorted works
export function getFilteredWorks(works: Work[], query: string, sortBy: SortField): Work[] {
  const q = query.trim().toLowerCase();
  let filtered = q
    ? works.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.circle.toLowerCase().includes(q) ||
          w.actors.some((a) => a.toLowerCase().includes(q))
      )
    : works;

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
