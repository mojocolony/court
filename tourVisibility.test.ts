import { describe, expect, it } from "vitest";
import { isMainTourMatch } from "../../src/domain/tourVisibility";

describe("isMainTourMatch", () => {
  it("includes ATP and WTA but excludes lower tours", () => {
    expect(isMainTourMatch({ tour: "ATP" })).toBe(true);
    expect(isMainTourMatch({ tour: "WTA" })).toBe(true);
    expect(isMainTourMatch({ tour: "CHALLENGER" })).toBe(false);
    expect(isMainTourMatch({ tour: "ITF" })).toBe(false);
    expect(isMainTourMatch({ tour: "JUNIORS" })).toBe(false);
    expect(isMainTourMatch({ tour: "UNKNOWN" })).toBe(false);
  });
});
