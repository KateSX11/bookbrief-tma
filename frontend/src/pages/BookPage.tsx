import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchBook, type BookDetail, type SummaryData } from "../services/api";
import AudioPlayer from "../components/AudioPlayer";

type Tab = "read" | "listen";

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-TW";

  const [book, setBook] = useState<BookDetail | null>(null);
  const [tab, setTab] = useState<Tab>("read");
  const [loading, setLoading] = useState(true);

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
        <p className="text-[var(--tg-theme-hint-color)]">{t("loading")}</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-[var(--tg-theme-hint-color)]">{t("book_not_found")}</p>
        <button onClick={() => navigate("/")} className="text-[var(--tg-theme-link-color)]">
          {t("back")}
        </button>
      </div>
    );
  }

  const title = isZh ? book.title_zh : book.title_ru;
  const author = isZh ? book.author_zh : book.author_ru;
  const summary: SummaryData | null = isZh ? book.summary_zh : book.summary_ru;
  const audioUrl = isZh ? book.audio_zh_url : book.audio_ru_url;

  return (
    <div className="pb-8">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-[var(--tg-theme-link-color)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.354 3.354a.5.5 0 00-.708-.708l-5 5a.5.5 0 000 .708l5 5a.5.5 0 00.708-.708L5.707 8l4.647-4.646z" />
          </svg>
          {t("back")}
        </button>
      </div>

      {/* Book Header */}
      <div className="flex gap-4 px-4 mt-1">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={title}
            className="h-36 w-24 shrink-0 rounded-xl object-cover shadow-md"
          />
        ) : (
          <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--tg-theme-button-color)] to-blue-400 shadow-md">
            <span className="text-3xl font-bold text-white">{title[0]}</span>
          </div>
        )}
        <div className="flex flex-col justify-center">
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
          <p className="mt-1 text-sm text-[var(--tg-theme-hint-color)]">{author}</p>
          <div className="mt-2 flex gap-3 text-xs text-[var(--tg-theme-hint-color)]">
            <span>{t("read_min", { min: book.read_time_minutes })}</span>
            <span>{t("listen_min", { min: book.listen_time_minutes })}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 px-4">
        <TabButton active={tab === "read"} onClick={() => setTab("read")} label={t("tab_read")} />
        <TabButton
          active={tab === "listen"}
          onClick={() => setTab("listen")}
          label={t("tab_listen")}
        />
      </div>

      {/* Content */}
      <div className="mt-4 px-4">
        {tab === "read" && summary && <ReadView summary={summary} />}
        {tab === "listen" &&
          (audioUrl ? (
            <AudioPlayer src={audioUrl} />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--tg-theme-hint-color)]">
              {t("audio_not_available")}
            </p>
          ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
          : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]"
      }`}
    >
      {label}
    </button>
  );
}

function ReadView({ summary }: { summary: SummaryData }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      {/* Key Insights */}
      {summary.key_insights?.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">{t("key_insights")}</h2>
          <div className="flex flex-col gap-3">
            {summary.key_insights.map((item, i) => (
              <div
                key={i}
                className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4"
              >
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--tg-theme-hint-color)]">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chapters */}
      {summary.chapters?.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">{t("chapters")}</h2>
          <div className="flex flex-col gap-3">
            {summary.chapters.map((ch, i) => (
              <div
                key={i}
                className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4"
              >
                <h3 className="text-sm font-semibold">{ch.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--tg-theme-hint-color)]">
                  {ch.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quotes */}
      {summary.quotes?.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold">{t("quotes")}</h2>
          <div className="flex flex-col gap-2.5">
            {summary.quotes.map((q, i) => (
              <blockquote
                key={i}
                className="border-l-3 border-[var(--tg-theme-button-color)] pl-4 py-2
                  text-sm italic leading-relaxed text-[var(--tg-theme-hint-color)]"
              >
                "{q}"
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
