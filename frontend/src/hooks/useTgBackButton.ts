import { useEffect } from "react";
import { getTelegramWebApp } from "../lib/telegram";

export function useTgBackButton(onBack: () => void) {
  useEffect(() => {
    const webapp = getTelegramWebApp();
    if (!webapp) return;

    webapp.BackButton.show();
    webapp.BackButton.onClick(onBack);

    return () => {
      webapp.BackButton.offClick(onBack);
      webapp.BackButton.hide();
    };
  }, [onBack]);
}
