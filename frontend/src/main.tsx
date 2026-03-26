import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initTelegramApp } from "./telegram.ts";
import App from "./App.tsx";
import "./i18n/index.ts";
import "./index.css";

initTelegramApp();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
