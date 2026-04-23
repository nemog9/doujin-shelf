import { LinkOpenMode } from "../types";

interface Props {
  linkOpenMode: LinkOpenMode;
  onChangeLinkOpenMode: (mode: LinkOpenMode) => void;
  preventSleepDuringImport: boolean;
  onChangePreventSleepDuringImport: (enabled: boolean) => void;
  canExport: boolean;
  onExport: () => void;
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

export function SettingsView({
  linkOpenMode,
  onChangeLinkOpenMode,
  preventSleepDuringImport,
  onChangePreventSleepDuringImport,
  canExport,
  onExport,
}: Props) {
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
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{option.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{option.description}</p>
                </div>
                <span
                  className={`mt-0.5 shrink-0 inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                    active ? "bg-violet-500/90" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">DMM取得</h2>
        <button
          onClick={() => onChangePreventSleepDuringImport(!preventSleepDuringImport)}
          className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
            preventSleepDuringImport
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-white/10 bg-slate-900/50 hover:border-slate-600"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100">取得中はスリープさせない</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                AndroidでDMMライブラリ取得を走らせている間だけ画面スリープを抑えます。
              </p>
            </div>
            <span
              className={`mt-0.5 shrink-0 inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                preventSleepDuringImport ? "bg-emerald-500/90" : "bg-slate-700"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition-transform ${
                  preventSleepDuringImport ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </div>
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-100">データ書き出し</h2>
        <button
          onClick={onExport}
          disabled={!canExport}
          className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
            canExport
              ? "border-sky-500 bg-sky-500/10 hover:bg-sky-500/15"
              : "border-white/10 bg-slate-900/40 text-slate-500"
          }`}
        >
          <p className="text-sm font-medium text-slate-100">CSVを書き出す</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            現在のライブラリをCSVにして、保存先を選んで書き出します。
          </p>
        </button>
      </section>

    </main>
  );
}
