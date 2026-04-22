import { LinkOpenMode } from "../types";

interface Props {
  linkOpenMode: LinkOpenMode;
  onChangeLinkOpenMode: (mode: LinkOpenMode) => void;
}

const OPTIONS: { id: LinkOpenMode; title: string; description: string }[] = [
  {
    id: "external",
    title: "デフォルトブラウザ",
    description: "標準のブラウザアプリで開きます。既定の動作です。",
  },
  {
    id: "inApp",
    title: "アプリ内ブラウザ",
    description: "このアプリ内で開きます。将来の作品取得導線にも使いやすい設定です。",
  },
];

export function SettingsView({ linkOpenMode, onChangeLinkOpenMode }: Props) {
  return (
    <main className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-24 space-y-4">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">作品リンクの開き方</h2>
        <p className="text-xs leading-relaxed text-slate-400">
          作品詳細を開くボタンを押したときの遷移先を選べます。
        </p>
      </section>

      <section className="space-y-3">
        {OPTIONS.map((option) => {
          const active = option.id === linkOpenMode;
          return (
            <button
              key={option.id}
              onClick={() => onChangeLinkOpenMode(option.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                active
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 bg-slate-900/50 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-100">{option.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{option.description}</p>
                </div>
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                    active
                      ? "border-violet-400 bg-violet-500 text-white"
                      : "border-slate-600 text-slate-500"
                  }`}
                >
                  {active ? "✓" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <h3 className="text-sm font-medium text-slate-100">メモ</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Android単体で作品取得まで完結させる場合は、アプリ内ブラウザ側でDMMログイン状態を保ちながらライブラリDOMを読む流れが有力です。
        </p>
      </section>
    </main>
  );
}
