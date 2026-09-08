import { describe, expect, it } from "vitest";
import { dateFromLocalKey, dateRailItems, localDateKey } from "../../src/app/todayDates";

describe("Today date rail", () => {
  it("starts with the current local day and includes five upcoming days", () => {
    const base = new Date(2026, 8, 8, 10, 30);
    const items = dateRailItems(base);
    expect(items).toHaveLength(6);
    expect(items[0].key).toBe("2026-09-08");
    expect(items[0].isToday).toBe(true);
    expect(items[5].key).toBe("2026-09-13");
  });

  it("round-trips a local calendar key without UTC date drift", () => {
    const date = dateFromLocalKey("2026-09-08");
    expect(localDateKey(date)).toBe("2026-09-08");
  });
});
