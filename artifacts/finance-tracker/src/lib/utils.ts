import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const SETTINGS_STORAGE_KEY = "fintrack_settings";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSavedCurrency() {
  if (typeof window === "undefined") return "USD";

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return "USD";

    const parsed = JSON.parse(raw);
    return typeof parsed?.currency === "string" && parsed.currency.trim()
      ? parsed.currency
      : "USD";
  } catch {
    return "USD";
  }
}

export function formatCurrency(amount: number, currency?: string) {
  const selectedCurrency = currency || getSavedCurrency();
  const locale = selectedCurrency === "INR" ? "en-IN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: selectedCurrency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

export function formatCompactCurrency(amount: number, currency?: string) {
  const selectedCurrency = currency || getSavedCurrency();
  const locale = selectedCurrency === "INR" ? "en-IN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: selectedCurrency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount || 0));
}