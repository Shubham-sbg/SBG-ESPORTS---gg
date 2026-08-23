import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function getGameColor(game: string) {
  const colors: Record<string, string> = {
    "free fire": "#ff6b00", freefire: "#ff6b00",
    bgmi: "#e94560", valorant: "#ff4655",
    "cod mobile": "#7c3aed", codm: "#7c3aed",
  };
  return colors[game.toLowerCase()] || "#ff6b00";
}

export function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "live": case "ongoing": return "badge-live";
    case "upcoming": return "badge-upcoming";
    case "completed": return "badge-completed";
    case "active": return "badge-active";
    default: return "badge-upcoming";
  }
}
