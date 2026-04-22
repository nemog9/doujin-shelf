export type Tab = "list" | "favorites" | "random";

interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  favoritesCount: number;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "list", label: "一覧", icon: "▤" },
  { id: "favorites", label: "お気に入り", icon: "♥" },
  { id: "random", label: "ランダム", icon: "🎲" },
];

export function BottomNav({ activeTab, onChange, favoritesCount }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[#1a1a2e] border-t border-white/10 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
            activeTab === tab.id ? "text-violet-400" : "text-slate-500"
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="text-[10px] font-medium">{tab.label}</span>
          {tab.id === "favorites" && favoritesCount > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-14px)] min-w-[16px] h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
              {favoritesCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
