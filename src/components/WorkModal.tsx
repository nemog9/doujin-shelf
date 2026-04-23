import { useState, useEffect } from "react";
import { Work } from "../types";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useAppStore } from "../store";


interface Props {
  work: Work;
  onClose: () => void;
  onFilterBy: (query: string) => void;
  onDelete: () => void;
}

const SOURCE_LABEL: Record<Work["source"], string> = {
  dmm: "DMM",
  dlsite: "DLsite",
  other: "Other",
};

function extractDmmProductId(work: Work): string {
  if (work.productId) return work.productId;
  const match = work.productUrl.match(/(?:product_id|cid)=([\w-]+)/i);
  return match?.[1] ?? "";
}

function getOpenUrl(work: Work): string {
  if (work.source !== "dmm") return work.productUrl;
  const productId = extractDmmProductId(work);
  return productId
    ? `https://www.dmm.co.jp/dc/-/mylibrary/detail/=/product_id=${productId}/`
    : work.productUrl;
}

export function WorkModal({ work, onClose, onFilterBy, onDelete }: Props) {
  const [imgError, setImgError] = useState(false);
  const linkOpenMode = useAppStore((state) => state.linkOpenMode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function openProductPage() {
    const openTarget = getOpenUrl(work);
    if (!openTarget) return;
    if (isTauri()) {
      if (linkOpenMode === "inApp" && window.AppBridge) {
        window.AppBridge.openUrl(openTarget);
        return;
      }
      try {
        await openUrl(openTarget);
      } catch (err) {
        alert(`URL を開けませんでした:\n${err}`);
      }
    } else {
      const a = document.createElement("a");
      a.href = openTarget;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a2e] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pt-2">
          <button
            onClick={onDelete}
            className="text-[11px] text-rose-400 hover:text-rose-300 px-1.5 py-1"
          >
            削除
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm p-1">
            ✕ 閉じる
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hide px-4 pb-6 space-y-4">
          {/* Thumbnail */}
          <div className="aspect-video w-full bg-slate-700 rounded-xl overflow-hidden">
            {!imgError && work.thumbnailUrl ? (
              <img
                src={work.thumbnailUrl}
                alt={work.title}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-slate-600">
                🎵
              </div>
            )}
          </div>

          {/* Title & circle */}
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-snug">{work.title}</h2>
            {work.circle && (
              <button
                onClick={() => onFilterBy(work.circle)}
                className="text-sm text-slate-400 mt-0.5 hover:text-violet-300 active:opacity-70 transition-colors text-left"
              >
                {work.circle}
              </button>
            )}
          </div>

          {/* Actors */}
          {work.actors.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">声優</p>
              <div className="flex flex-wrap gap-1.5">
                {work.actors.map((a) => (
                  <button
                    key={a}
                    onClick={() => onFilterBy(a)}
                    className="text-xs bg-violet-900/50 text-violet-300 border border-violet-700/40 px-2.5 py-0.5 rounded-full hover:bg-violet-800/60 active:opacity-70 transition-colors"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/60 rounded-lg px-3 py-2">
              <p className="text-slate-500">サイト</p>
              <p className="text-slate-200">{SOURCE_LABEL[work.source]}</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg px-3 py-2">
              <p className="text-slate-500">追加日</p>
              <p className="text-slate-200">{new Date(work.importedAt).toLocaleDateString("ja-JP")}</p>
            </div>
          </div>

          {/* Open button */}
          {work.productUrl && (
            <button
              onClick={openProductPage}
              className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              ライブラリ詳細を開く →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
