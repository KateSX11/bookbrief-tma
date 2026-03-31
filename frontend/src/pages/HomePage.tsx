import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchBooks,
  fetchFeatured,
  fetchHot,
  type BookListItem,
} from "../services/api";

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
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600",
];

const GRADIENT_TINTS = [
  "from-blue-500/8 to-indigo-500/4",
  "from-violet-500/8 to-purple-500/4",
  "from-emerald-500/8 to-teal-500/4",
  "from-orange-500/8 to-red-500/4",
  "from-pink-500/8 to-rose-500/4",
  "from-cyan-500/8 to-blue-500/4",
];

function grad(id: number) {
  return `bg-gradient-to-br ${GRADIENTS[id % GRADIENTS.length]}`;
}

function tint(id: number) {
  return `bg-gradient-to-br ${GRADIENT_TINTS[id % GRADIENT_TINTS.length]}`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<BookListItem[]>([]);
  const [hot, setHot] = useState<BookListItem[]>([]);
  const [allBooks, setAllBooks] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchFeatured(), fetchHot(), fetchBooks()])
      .then(([f, h, a]) => {
        setFeatured(f);
        setHot(h);
        setAllBooks(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tg-theme-button-color)] border-t-transparent" />
      </div>
    );
  }

  const heroBook = featured[0] ?? null;

  return (
    <div className="pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--tg-theme-bg-color)]/95 backdrop-blur-sm px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">BookBrief</h1>
          <button
            onClick={() => navigate("/me")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color)] active:scale-95 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      <div className="space-y-7">
        {/* ── 今日推薦：只展示 1 本，大卡沉浸式 ── */}
        {heroBook && (
          <section className="px-5">
            <SectionTitle>今日推薦</SectionTitle>
            <HeroCard
              book={heroBook}
              onClick={() => navigate(`/book/${heroBook.id}`)}
            />
          </section>
        )}

        {/* ── 熱門精選：2x2 网格，横排小卡 ── */}
        {hot.length > 0 && (
          <section className="px-5">
            <SectionTitle>熱門精選</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              {hot.slice(0, 4).map((book) => (
                <HotCard
                  key={book.id}
                  book={book}
                  onClick={() => navigate(`/book/${book.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 所有書籍：紧凑信息流 ── */}
        {allBooks.length > 0 && (
          <section className="px-5">
            <SectionTitle>所有書籍</SectionTitle>
            <div className="space-y-2.5">
              {allBooks.map((book) => (
                <FeedCard
                  key={book.id}
                  book={book}
                  onClick={() => navigate(`/book/${book.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-base font-semibold tracking-tight">{children}</h2>
  );
}

/* ────────────────────────────────────────────
   封面组件：cover_url 有图显示图，无图用渐变占位
   ──────────────────────────────────────────── */
function BookCover({
  url,
  title,
  bookId,
  className,
  rounded = "rounded-xl",
  textSize = "text-2xl",
}: {
  url: string | null;
  title: string;
  bookId: number;
  className: string;
  rounded?: string;
  textSize?: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={title}
        className={`${className} ${rounded} object-cover`}
        style={{ aspectRatio: "2/3" }}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`${className} ${rounded} ${grad(bookId)} flex items-center justify-center`}
      style={{ aspectRatio: "2/3" }}
    >
      <span className={`${textSize} font-bold text-white/25`}>
        {title[0]}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────
   Hero Card — 今日推薦，只有 1 本，沉浸感最强
   渐变色底 + 大封面 + 文字信息
   ──────────────────────────────────────────── */
function HeroCard({
  book,
  onClick,
}: {
  book: BookListItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl overflow-hidden ${tint(book.id)} active:scale-[0.98] transition-transform`}
      style={{ boxShadow: "0 4px 20px var(--color-card-shadow)" }}
    >
      <div className="flex gap-5 p-4">
        {/* 大封面 */}
        <BookCover
          url={book.cover_url}
          title={book.title}
          bookId={book.id}
          className="w-[110px] shrink-0 shadow-lg"
          rounded="rounded-xl"
          textSize="text-3xl"
        />

        {/* 文字区 */}
        <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CategoryTag category={book.category} />
              {book.is_free ? <FreeBadge /> : <PaidBadge />}
            </div>
            <h3 className="text-lg font-bold leading-tight">{book.title}</h3>
            <p className="mt-1 text-sm text-[var(--tg-theme-hint-color)]">
              {book.author}
            </p>
          </div>

          <div className="mt-3">
            <p className="text-[13px] leading-relaxed text-[var(--tg-theme-text-color)]/75 line-clamp-2">
              「{book.tagline}」
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--tg-theme-hint-color)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{book.time} 分鐘</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────
   Hot Card — 2x2 网格，横排：左封面 + 右文字
   封面保持 2:3，紧凑但有呼吸感
   ──────────────────────────────────────────── */
function HotCard({
  book,
  onClick,
}: {
  book: BookListItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex gap-2.5 p-2.5 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] text-left active:scale-[0.97] transition-transform"
      style={{ boxShadow: "0 1px 6px var(--color-card-shadow)" }}
    >
      {/* 封面：小竖版 2:3 */}
      <BookCover
        url={book.cover_url}
        title={book.title}
        bookId={book.id}
        className="w-[48px] shrink-0"
        rounded="rounded-lg"
        textSize="text-lg"
      />

      {/* 文字 */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold leading-tight line-clamp-1">
          {book.title}
        </h3>
        <p className="mt-0.5 text-[10px] text-[var(--tg-theme-hint-color)]">
          {book.author}
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-[var(--tg-theme-hint-color)] line-clamp-2">
          {book.tagline}
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          <CategoryTag category={book.category} />
        </div>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────
   Feed Card — 信息流列表卡
   ──────────────────────────────────────────── */
function FeedCard({
  book,
  onClick,
}: {
  book: BookListItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex gap-3 rounded-2xl p-2.5 bg-[var(--tg-theme-secondary-bg-color)] text-left active:scale-[0.98] transition-transform"
      style={{ boxShadow: "0 1px 4px var(--color-card-shadow)" }}
    >
      <BookCover
        url={book.cover_url}
        title={book.title}
        bookId={book.id}
        className="w-[52px] shrink-0"
        rounded="rounded-lg"
      />

      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="text-[13px] font-semibold leading-tight line-clamp-1 flex-1">
            {book.title}
          </h3>
          <CategoryTag category={book.category} />
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--tg-theme-hint-color)]">
          {book.author} · {book.time} 分鐘
        </p>
        <p className="mt-1 text-[11px] text-[var(--tg-theme-hint-color)] leading-relaxed line-clamp-2">
          「{book.tagline}」
        </p>
      </div>
    </button>
  );
}

/* ── 通用小组件 ── */
function CategoryTag({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  return (
    <span className="inline-block shrink-0 rounded-full bg-[var(--tg-theme-button-color)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--tg-theme-button-color)]">
      {label}
    </span>
  );
}

function FreeBadge() {
  return (
    <span className="inline-block shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
      免費
    </span>
  );
}

function PaidBadge() {
  return (
    <span className="inline-block shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
      付費
    </span>
  );
}
