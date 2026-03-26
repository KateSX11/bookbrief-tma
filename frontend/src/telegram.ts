declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        colorScheme: "light" | "dark";
        themeParams: Record<string, string>;
        initData: string;
        initDataUnsafe: Record<string, unknown>;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp ?? null;
}

export function isTelegramEnvironment(): boolean {
  return !!window.Telegram?.WebApp?.initData;
}

export function initTelegramApp() {
  const webapp = getTelegramWebApp();
  if (!webapp) return;

  webapp.ready();
  webapp.expand();

  const tp = webapp.themeParams;
  const root = document.documentElement;
  const map: Record<string, string> = {
    bg_color: "--tg-theme-bg-color",
    text_color: "--tg-theme-text-color",
    hint_color: "--tg-theme-hint-color",
    link_color: "--tg-theme-link-color",
    button_color: "--tg-theme-button-color",
    button_text_color: "--tg-theme-button-text-color",
    secondary_bg_color: "--tg-theme-secondary-bg-color",
  };

  for (const [tgKey, cssVar] of Object.entries(map)) {
    const val = tp[tgKey];
    if (val) root.style.setProperty(cssVar, val);
  }
}
