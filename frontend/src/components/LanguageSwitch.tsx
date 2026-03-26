import { useTranslation } from "react-i18next";

export default function LanguageSwitch() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === "zh-TW";

  const toggle = () => {
    const next = isZh ? "ru" : "zh-TW";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium
        bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]
        active:opacity-70 transition-opacity"
    >
      <span className={isZh ? "opacity-100" : "opacity-40"}>繁中</span>
      <span className="text-[var(--tg-theme-hint-color)]">/</span>
      <span className={!isZh ? "opacity-100" : "opacity-40"}>RU</span>
    </button>
  );
}
