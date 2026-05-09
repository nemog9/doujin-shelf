import { useEffect, useRef, useState } from "react";
import { Work } from "../types";
import { useAppStore } from "../store";

interface Props {
  work: Work;
  onClose: () => void;
}

const GENRE_OPTIONS = [
  { value: "", label: "未分類" },
  { value: "ボイス", label: "ボイス" },
  { value: "コミック", label: "コミック" },
  { value: "動画", label: "動画" },
  { value: "CG", label: "CG" },
];

export function EditWorkModal({ work, onClose }: Props) {
  const updateWork = useAppStore((s) => s.updateWork);

  const [title, setTitle] = useState(work.title);
  const [circle, setCircle] = useState(work.circle);
  const [actors, setActors] = useState<string[]>(work.actors);
  const [genre, setGenre] = useState(work.genre);
  const [actorInput, setActorInput] = useState("");

  const actorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function addActor() {
    const trimmed = actorInput.trim();
    if (!trimmed || actors.includes(trimmed)) return;
    setActors([...actors, trimmed]);
    setActorInput("");
    actorInputRef.current?.focus();
  }

  function removeActor(actor: string) {
    setActors(actors.filter((a) => a !== actor));
  }

  function handleActorKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addActor();
    } else if (e.key === "Backspace" && actorInput === "" && actors.length > 0) {
      setActors(actors.slice(0, -1));
    }
  }

  function handleSave() {
    updateWork(work.id, {
      title: title.trim() || work.title,
      circle: circle.trim(),
      actors,
      genre,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      style={{ touchAction: "none" }}
    >
      <div
        className="bg-[#1a1a2e] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-white/10">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
          >
            キャンセル
          </button>
          <span className="text-sm font-semibold text-slate-200">作品情報を編集</span>
          <button
            onClick={handleSave}
            className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors px-2 py-1"
          >
            保存
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hide px-4 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Circle */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">サークル</label>
            <input
              type="text"
              value={circle}
              onChange={(e) => setCircle(e.target.value)}
              className="w-full bg-slate-800 text-slate-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Actors */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">声優 / アーティスト</label>
            <div className="bg-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-violet-500">
              {actors.map((actor) => (
                <span
                  key={actor}
                  className="inline-flex items-center gap-1 text-xs bg-violet-900/60 text-violet-300 border border-violet-700/40 px-2 py-0.5 rounded-full"
                >
                  {actor}
                  <button
                    onClick={() => removeActor(actor)}
                    className="text-violet-400 hover:text-violet-200 leading-none"
                    tabIndex={-1}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                ref={actorInputRef}
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                onKeyDown={handleActorKeyDown}
                placeholder={actors.length === 0 ? "名前を入力して Enter" : ""}
                className="flex-1 min-w-[120px] bg-transparent text-slate-100 text-sm outline-none placeholder-slate-600"
              />
            </div>
            {actorInput && (
              <button
                onClick={addActor}
                className="mt-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                「{actorInput}」を追加
              </button>
            )}
          </div>

          {/* Genre */}
          <div>
            <label className="text-xs text-slate-500 mb-1.5 block">ジャンル</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGenre(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    genre === opt.value
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
