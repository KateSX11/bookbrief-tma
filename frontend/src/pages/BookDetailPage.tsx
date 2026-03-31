import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBook, type BookDetail } from "../services/api";
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

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useTgBackButton(() => navigate("/"));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchBook(Number(id))
      .then(setBook)
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tg-theme-button-color)] border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-5">
        <p className="text-[var(--tg-theme-hint-color)]">找不到這本書</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-[var(--tg-theme-link-color)]"
        >
          返回首頁
        </button>
      </div>
    );
  }

  const gradient = GRADIENTS[book.id % GRADIENTS.length];
  const categoryLabel = CATEGORY_LABELS[book.category] ?? book.category;

  return (
    <div className="pb-28">
      {/* Book Header */}
      <div className={`${gradient} px-5 pt-14 pb-6`}>
        <div className="flex gap-4">
          <div className="h-[120px] w-[84px] shrink-0 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white/40">
              {book.title[0]}
            </span>
          </div>
          <div className="flex flex-col justify-center text-white min-w-0">
            <span className="inline-block self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium mb-2">
              {categoryLabel}
            </span>
            <h1 className="text-xl font-bold leading-tight">{book.title}</h1>
            <p className="mt-1 text-sm text-white/80">{book.author}</p>
            <p className="mt-1.5 text-xs text-white/60">
              {book.time} 分鐘
              {!book.is_free && " · 付費內容"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 mt-5">
        {/* Quotes */}
        {book.quotes.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[var(--tg-theme-hint-color)] mb-3">
              金句摘錄
            </h2>
            <div className="space-y-2.5">
              {book.quotes.map((q, i) => (
                <blockquote
                  key={i}
                  className="border-l-[3px] border-[var(--tg-theme-button-color)] pl-3.5 py-1"
                >
                  <p className="text-sm leading-relaxed text-[var(--tg-theme-hint-color)]">
                    「{q}」
                  </p>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Chapters */}
        {book.chapters.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[var(--tg-theme-hint-color)] mb-3">
              章節目錄
            </h2>
            <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] overflow-hidden divide-y divide-[var(--tg-theme-bg-color)]">
              {book.chapters.map((ch) => (
                <div
                  key={ch.index}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color)] text-xs font-semibold text-[var(--tg-theme-button-color)]">
                    {ch.index}
                  </span>
                  <span className="text-sm font-medium leading-tight flex-1 line-clamp-2">
                    {ch.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color)] backdrop-blur-sm border-t border-[var(--tg-theme-secondary-bg-color)] px-5 py-3 safe-area-bottom">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/book/${book.id}/read/1`)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--tg-theme-button-color)] py-3 text-sm font-semibold text-[var(--tg-theme-button-text-color)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            開始閱讀
          </button>
          <button
            onClick={() => navigate(`/book/${book.id}/listen/1`)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] py-3 text-sm font-semibold text-[var(--tg-theme-text-color)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            開始聆聽
          </button>
        </div>
      </div>
    </div>
  );
}
