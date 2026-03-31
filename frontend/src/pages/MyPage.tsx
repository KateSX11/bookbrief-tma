import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchHistory, type HistoryItem } from "../services/api";
import { getTgUserId } from "../lib/telegram";
import { useTgBackButton } from "../hooks/useTgBackButton";

const CATEGORY_LABELS: Record<string, string> = {
  "self-improvement": "自我成長",
  business: "商業理財",
  psychology: "心理學",
  productivity: "效率提升",
  relationships: "人際關係",
  health: "健康養生",
  technology: "科技趨勢",
  philosophy: "哲學思考",
  finance: "投資理財",
  creativity: "創意思維",
};

const GRADIENTS = [
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-cyan-500 to-blue-600",
];

export default function MyPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const goBack = useCallback(() => navigate("/"), [navigate]);
  useTgBackButton(goBack);

  useEffect(() => {
    const tgId = getTgUserId();
    fetchHistory(tgId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-8">
      {/* Header */}
      <header className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">我的</h1>
        </div>
      </header>

      <div className="px-5">
        <h2 className="text-sm font-semibold text-[var(--tg-theme-hint-color)] mb-3">
          最近閱讀
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tg-theme-button-color)] border-t-transparent" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              還沒有閱讀紀錄
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-3 text-sm text-[var(--tg-theme-link-color)]"
            >
              去探索書籍
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const gradient = GRADIENTS[item.book_id % GRADIENTS.length];
              const modeLabel = item.mode === "listen" ? "聆聽" : "閱讀";
              const categoryLabel =
                CATEGORY_LABELS[item.book_category] ?? item.book_category;
              return (
                <button
                  key={`${item.book_id}-${item.mode}`}
                  onClick={() => {
                    const path =
                      item.mode === "listen"
                        ? `/book/${item.book_id}/listen/${item.last_chapter}`
                        : `/book/${item.book_id}/read/${item.last_chapter}`;
                    navigate(path);
                  }}
                  className="w-full flex gap-3.5 rounded-2xl p-3 bg-[var(--tg-theme-secondary-bg-color)] text-left"
                >
                  <div
                    className={`${gradient} h-16 w-12 shrink-0 rounded-lg flex items-center justify-center`}
                  >
                    <span className="text-lg font-bold text-white/30">
                      {item.book_title[0]}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-1">
                      {item.book_title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--tg-theme-hint-color)]">
                      {categoryLabel} · {modeLabel}至第 {item.last_chapter} 章
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--tg-theme-hint-color)]">
                      {formatDate(item.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-[var(--tg-theme-link-color)]">
                      繼續
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "剛剛";
    if (mins < 60) return `${mins} 分鐘前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小時前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} 天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "";
  }
}
