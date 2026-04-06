import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChapter, saveProgress, type ChapterDetail } from "../services/api";
import { getTgUserId } from "../lib/telegram";
import { useTgBackButton } from "../hooks/useTgBackButton";

const GRADIENTS = [
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-orange-500 to-red-500",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-cyan-500 to-blue-600",
];

export default function ListenPage() {
  const { id, chapter } = useParams<{ id: string; chapter: string }>();
  const navigate = useNavigate();
  const bookId = Number(id);
  const chapterIndex = Number(chapter);

  const [data, setData] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const goBack = useCallback(
    () => navigate(`/book/${bookId}`),
    [navigate, bookId]
  );
  useTgBackButton(goBack);

  useEffect(() => {
    if (!id || !chapter) return;
    setLoading(true);
    setPlaying(false);
    setProgress(0);
    fetchChapter(bookId, chapterIndex)
      .then((d) => {
        setData(d);
        saveProgress(getTgUserId(), bookId, chapterIndex, "listen").catch(
          () => {}
        );
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id, chapter, bookId, chapterIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [data?.audio_url]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setProgress(val);
    if (audioRef.current) audioRef.current.currentTime = val;
  };

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

  const hasPrev = chapterIndex > 0;
  const hasNext = chapterIndex < data.total_chapters - 1;
  const gradient = GRADIENTS[bookId % GRADIENTS.length];
  const hasAudio = !!data.audio_url;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="px-5 py-3 flex items-center justify-between">
        <button
          onClick={goBack}
          className="text-sm text-[var(--tg-theme-link-color)] flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          返回
        </button>
        <span className="text-xs text-[var(--tg-theme-hint-color)]">
          {chapterIndex + 1} / {data.total_chapters}
        </span>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-8">
        <div
          className={`${gradient} w-48 h-48 rounded-3xl flex items-center justify-center shadow-xl`}
        >
          <span className="text-5xl font-bold text-white/25">
            {data.book_title[0]}
          </span>
        </div>
        <h2 className="mt-6 text-lg font-bold text-center leading-tight">
          {data.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--tg-theme-hint-color)]">
          {data.book_title}
        </p>

        {!hasAudio && (
          <div className="mt-6 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] px-4 py-3">
            <p className="text-xs text-[var(--tg-theme-hint-color)] text-center">
              音頻製作中，敬請期待
            </p>
          </div>
        )}

        {hasAudio && (
          <>
            <audio ref={audioRef} src={data.audio_url!} preload="metadata" />

            {/* Progress Bar */}
            <div className="mt-8 w-full">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={progress}
                onChange={seek}
                className="w-full h-1 accent-[var(--tg-theme-button-color)] rounded-full"
              />
              <div className="flex justify-between mt-1 text-[10px] text-[var(--tg-theme-hint-color)]">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-center gap-8">
              <button
                disabled={!hasPrev}
                onClick={() =>
                  navigate(`/book/${bookId}/listen/${chapterIndex - 1}`)
                }
                className="p-2 disabled:opacity-30"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tg-theme-button-color)]"
              >
                {playing ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--tg-theme-button-text-color)">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--tg-theme-button-text-color)">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                disabled={!hasNext}
                onClick={() =>
                  navigate(`/book/${bookId}/listen/${chapterIndex + 1}`)
                }
                className="p-2 disabled:opacity-30"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </>
        )}

        {!hasAudio && (
          <div className="mt-6 flex items-center gap-6">
            <button
              disabled={!hasPrev}
              onClick={() =>
                navigate(`/book/${bookId}/listen/${chapterIndex - 1}`)
              }
              className="text-sm text-[var(--tg-theme-link-color)] disabled:opacity-30"
            >
              ← 上一章
            </button>
            <button
              disabled={!hasNext}
              onClick={() =>
                navigate(`/book/${bookId}/listen/${chapterIndex + 1}`)
              }
              className="text-sm text-[var(--tg-theme-link-color)] disabled:opacity-30"
            >
              下一章 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
