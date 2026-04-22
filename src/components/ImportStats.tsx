import { ImportResult } from "../types";

interface Props {
  result: ImportResult;
  onDismiss: () => void;
}

export function ImportStats({ result, onDismiss }: Props) {
  return (
    <div className="mx-3 mt-2 bg-slate-800/80 border border-violet-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
      <span className="text-2xl mt-0.5">📥</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-violet-300 truncate">{result.filename}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs">
          <span className="text-green-400">+{result.added}件追加</span>
          {result.duplicates > 0 && (
            <span className="text-slate-400">{result.duplicates}件重複スキップ</span>
          )}
          {result.errors > 0 && (
            <span className="text-red-400">{result.errors}件エラー</span>
          )}
        </div>
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 text-sm shrink-0">
        ✕
      </button>
    </div>
  );
}
