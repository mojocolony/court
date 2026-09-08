export interface DateRailItem {
  key: string;
  date: Date;
  label: string;
  day: string;
  isToday: boolean;
}

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dateFromLocalKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function dateRailItems(base = new Date(), count = 6): DateRailItem[] {
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
  const todayKey = localDateKey(start);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index, 12, 0, 0, 0);
    const key = localDateKey(date);
    return {
      key,
      date,
      label: index === 0
        ? "Today"
        : new Intl.DateTimeFormat("en-CA", { weekday: "short" }).format(date),
      day: new Intl.DateTimeFormat("en-CA", { day: "numeric" }).format(date),
      isToday: key === todayKey
    };
  });
}
