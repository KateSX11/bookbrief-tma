import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchBooks, fetchCategories, type BookListItem } from "../services/api";
import BookCard from "../components/BookCard";
import LanguageSwitch from "../components/LanguageSwitch";

export default function HomePage() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBooks(activeCategory ?? undefined)
      .then(setBooks)
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{t("app_name")}</h1>
          <LanguageSwitch />
        </div>

        {/* Category Tabs */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <CategoryPill
            label={t("all")}
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryPill
              key={cat}
              label={t(cat)}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Book List */}
      <div className="px-4 mt-2">
        {loading ? (
          <p className="py-12 text-center text-[var(--tg-theme-hint-color)]">{t("loading")}</p>
        ) : books.length === 0 ? (
          <p className="py-12 text-center text-[var(--tg-theme-hint-color)]">{t("no_books")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
          : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]"
      }`}
    >
      {label}
    </button>
  );
}
