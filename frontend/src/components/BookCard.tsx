import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { BookListItem } from "../services/api";

interface Props {
  book: BookListItem;
}

const CATEGORY_COLORS: Record<string, string> = {
  business: "bg-blue-100 text-blue-700",
  psychology: "bg-purple-100 text-purple-700",
  technology: "bg-green-100 text-green-700",
  literature: "bg-amber-100 text-amber-700",
  self_help: "bg-rose-100 text-rose-700",
  science: "bg-cyan-100 text-cyan-700",
};

export default function BookCard({ book }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isZh = i18n.language === "zh-TW";

  const title = isZh ? book.title_zh : book.title_ru;
  const author = isZh ? book.author_zh : book.author_ru;
  const colorClass = CATEGORY_COLORS[book.category] || "bg-gray-100 text-gray-700";

  return (
    <button
      onClick={() => navigate(`/book/${book.id}`)}
      className="flex gap-3 rounded-2xl p-3 text-left w-full
        bg-[var(--tg-theme-secondary-bg-color)] active:opacity-80 transition-opacity"
    >
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt={title}
          className="h-28 w-20 shrink-0 rounded-lg object-cover shadow-sm"
        />
      ) : (
        <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--tg-theme-button-color)] to-blue-400 shadow-sm">
          <span className="text-2xl text-white font-bold">{title[0]}</span>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="text-base font-semibold leading-tight line-clamp-2">{title}</h3>
          <p className="mt-1 text-sm text-[var(--tg-theme-hint-color)] truncate">{author}</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
            {t(book.category)}
          </span>
          <span className="text-xs text-[var(--tg-theme-hint-color)]">
            {t("read_min", { min: book.read_time_minutes })}
          </span>
        </div>
      </div>
    </button>
  );
}
