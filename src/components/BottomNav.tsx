import { HeartIcon } from "./HeartIcon";

export type Tab = "list" | "favorites" | "random" | "settings";

interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "list",      label: "一覧",      icon: "📚" },
  { id: "favorites", label: "お気に入り", icon: "" },   // SVGで描画
  { id: "random",    label: "ランダム",   icon: "🎲" },
  { id: "settings",  label: "設定",      icon: "⚙" },
];

export function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-[#1a1a2e] border-t border-white/10 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
              isActive ? "text-violet-400" : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none flex items-center justify-center h-[1.125rem]">
              {tab.id === "favorites"
                ? <HeartIcon filled={isActive} size={19} />
                : tab.icon}
            </span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
