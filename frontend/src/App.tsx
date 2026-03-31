import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BookDetailPage from "./pages/BookDetailPage";
import ReadPage from "./pages/ReadPage";
import ListenPage from "./pages/ListenPage";
import MyPage from "./pages/MyPage";

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/book/:id/read/:chapter" element={<ReadPage />} />
        <Route path="/book/:id/listen/:chapter" element={<ListenPage />} />
        <Route path="/me" element={<MyPage />} />
      </Routes>
    </div>
  );
}
