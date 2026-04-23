interface Props {
  onImport: () => void;
  onImportFromDmm?: () => void;
}

export function EmptyState({ onImport, onImportFromDmm }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-[60dvh] px-8 text-center space-y-4">
      <div className="text-6xl">🎵</div>
      <div>
        <p className="text-lg font-semibold text-slate-200">作品がありません</p>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">
          CSVファイルをインポートして<br />音声作品を追加してください
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {onImportFromDmm && (
          <button
            onClick={onImportFromDmm}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            DMMライブラリから取得
          </button>
        )}
        <button
          onClick={onImport}
          className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          CSVをインポート
        </button>
      </div>

      <details className="w-full max-w-xs">
        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 select-none">
          CSV形式について
        </summary>
        <div className="mt-2 bg-slate-800/60 rounded-lg p-3 text-left text-xs text-slate-400 font-mono leading-relaxed">
          <p className="text-slate-300 font-sans font-medium mb-1">必須列:</p>
          <p>title, product_url</p>
          <p className="text-slate-300 font-sans font-medium mt-2 mb-1">任意列:</p>
          <p>circle, actors,</p>
          <p>thumbnail_url</p>
          <p className="text-slate-400 font-sans text-[10px] mt-1">
            actors はカンマ区切りで複数入力可
          </p>
        </div>
      </details>
    </div>
  );
}
