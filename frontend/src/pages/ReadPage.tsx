import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChapter, saveProgress, type ChapterDetail } from "../services/api";
import { getTgUserId } from "../lib/telegram";
import { useTgBackButton } from "../hooks/useTgBackButton";

export default function ReadPage() {
  const { id, chapter } = useParams<{ id: string; chapter: string }>();
  const navigate = useNavigate();
  const bookId = Number(id);
  const chapterIndex = Number(chapter);

  const [data, setData] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const goBack = useCallback(
    () => navigate(`/book/${bookId}`),
    [navigate, bookId]
  );
  useTgBackButton(goBack);

  useEffect(() => {
    if (!id || !chapter) return;
    setLoading(true);
    fetchChapter(bookId, chapterIndex)
      .then((d) => {
        setData(d);
        saveProgress(getTgUserId(), bookId, chapterIndex, "read").catch(
          () => {}
        );
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id, chapter, bookId, chapterIndex]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--tg-theme-button-color)] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-[var(--tg-theme-hint-color)]">章節內容暫無</p>
        <button
          onClick={goBack}
          className="text-sm text-[var(--tg-theme-link-color)]"
        >
          返回書籍
        </button>
      </div>
    );
  }

  const hasPrev = chapterIndex > 1;
  const hasNext = chapterIndex < data.total_chapters;

  return (
    <div className="pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] backdrop-blur-sm px-5 py-3 flex items-center justify-between border-b border-[var(--tg-theme-secondary-bg-color)]">
        <button
          onClick={goBack}
          className="text-sm text-[var(--tg-theme-link-color)] flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {data.book_title}
        </button>
        <span className="text-xs text-[var(--tg-theme-hint-color)]">
          第 {chapterIndex} 章 / 共 {data.total_chapters} 章
        </span>
      </div>

      {/* Content */}
      <article className="px-5 py-5">
        <h1 className="text-lg font-bold leading-tight mb-5">{data.title}</h1>
        <div className="prose-content">
          <MarkdownContent content={data.content ?? ""} />
        </div>
      </article>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color)] backdrop-blur-sm border-t border-[var(--tg-theme-secondary-bg-color)] px-5 py-3">
        <div className="flex gap-3">
          <button
            disabled={!hasPrev}
            onClick={() =>
              navigate(`/book/${bookId}/read/${chapterIndex - 1}`)
            }
            className="flex-1 rounded-xl py-2.5 text-sm font-medium bg-[var(--tg-theme-secondary-bg-color)] disabled:opacity-30"
          >
            ← 上一章
          </button>
          <button
            disabled={!hasNext}
            onClick={() =>
              navigate(`/book/${bookId}/read/${chapterIndex + 1}`)
            }
            className="flex-1 rounded-xl py-2.5 text-sm font-medium bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] disabled:opacity-30"
          >
            下一章 →
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("# ")) {
      continue;
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-base font-bold mt-6 mb-2 text-[var(--tg-theme-text-color)]"
        >
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <p key={key++} className="text-sm font-semibold mt-3 mb-1">
          {trimmed.slice(2, -2)}
        </p>
      );
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={key++} className="text-sm leading-relaxed text-[var(--tg-theme-text-color)] ml-4 list-disc">
          {formatInline(trimmed.slice(2))}
        </li>
      );
    } else if (trimmed === "") {
      elements.push(<div key={key++} className="h-3" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm leading-[1.8] text-[var(--tg-theme-text-color)]">
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  return <div>{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--tg-theme-text-color)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
