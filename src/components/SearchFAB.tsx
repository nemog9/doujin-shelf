interface Props {
  onClick: () => void;
  hasActiveQuery: boolean;
}

export function SearchFAB({ onClick, hasActiveQuery }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
      style={{
        background: hasActiveQuery
          ? "linear-gradient(135deg, #7c3aed, #a855f7)"
          : "linear-gradient(135deg, #4c1d95, #6d28d9)",
        boxShadow: hasActiveQuery
          ? "0 0 0 3px rgba(167,85,247,0.4), 0 4px 20px rgba(0,0,0,0.4)"
          : "0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      <span className="text-2xl select-none">🔍</span>
      {hasActiveQuery && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-400 rounded-full border-2 border-[#0f0f1a]" />
      )}
    </button>
  );
}
