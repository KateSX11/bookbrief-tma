import axios from "axios";

const client = axios.create({ baseURL: "" });

export interface BookListItem {
  id: number;
  title_zh: string;
  title_ru: string;
  author_zh: string;
  author_ru: string;
  cover_url: string | null;
  category: string;
  read_time_minutes: number;
  listen_time_minutes: number;
}

export interface SummaryData {
  key_insights: { title: string; content: string }[];
  chapters: { title: string; content: string }[];
  quotes: string[];
}

export interface BookDetail extends BookListItem {
  summary_zh: SummaryData | null;
  summary_ru: SummaryData | null;
  audio_zh_url: string | null;
  audio_ru_url: string | null;
}

export async function fetchBooks(category?: string): Promise<BookListItem[]> {
  const params = category ? { category } : {};
  const { data } = await client.get<BookListItem[]>("/api/books", { params });
  return data;
}

export async function fetchCategories(): Promise<string[]> {
  const { data } = await client.get<string[]>("/api/books/categories");
  return data;
}

export async function fetchBook(id: number): Promise<BookDetail> {
  const { data } = await client.get<BookDetail>(`/api/books/${id}`);
  return data;
}
