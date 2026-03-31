import axios from "axios";

const client = axios.create({ baseURL: "" });

export interface BookListItem {
  id: number;
  title: string;
  author: string;
  category: string;
  tagline: string;
  time: number;
  cover_url: string | null;
  is_featured: boolean;
  is_hot: boolean;
  is_free: boolean;
}

export interface ChapterBrief {
  index: number;
  title: string;
  has_audio: boolean;
}

export interface BookDetail extends BookListItem {
  original_title?: string;
  quotes: string[];
  chapters: ChapterBrief[];
}

export interface ChapterDetail {
  index: number;
  title: string;
  content: string | null;
  audio_url: string | null;
  total_chapters: number;
  book_title: string;
  book_cover_url: string | null;
}

export interface HistoryItem {
  book_id: number;
  book_title: string;
  book_cover_url: string | null;
  book_category: string;
  last_chapter: number;
  mode: string;
  updated_at: string;
}

export const fetchBooks = async (category?: string): Promise<BookListItem[]> => {
  const params = category ? { category } : {};
  const { data } = await client.get<BookListItem[]>("/api/books", { params });
  return data;
};

export const fetchFeatured = async (): Promise<BookListItem[]> => {
  const { data } = await client.get<BookListItem[]>("/api/books/featured");
  return data;
};

export const fetchHot = async (): Promise<BookListItem[]> => {
  const { data } = await client.get<BookListItem[]>("/api/books/hot");
  return data;
};

export const fetchBook = async (id: number): Promise<BookDetail> => {
  const { data } = await client.get<BookDetail>(`/api/books/${id}`);
  return data;
};

export const fetchChapter = async (
  bookId: number,
  chapterIndex: number
): Promise<ChapterDetail> => {
  const { data } = await client.get<ChapterDetail>(
    `/api/books/${bookId}/chapters/${chapterIndex}`
  );
  return data;
};

export const fetchHistory = async (tgUserId: string): Promise<HistoryItem[]> => {
  const { data } = await client.get<HistoryItem[]>("/api/user/history", {
    params: { tg_user_id: tgUserId },
  });
  return data;
};

export const saveProgress = async (
  tgUserId: string,
  bookId: number,
  lastChapter: number,
  mode: string = "read"
) => {
  await client.post("/api/user/history", {
    tg_user_id: tgUserId,
    book_id: bookId,
    last_chapter: lastChapter,
    mode,
  });
};
