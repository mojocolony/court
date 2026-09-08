import { describe, expect, it } from "vitest";
import { matchHeading } from "../../src/app/matchHeading";

describe("matchHeading", () => {
  it("uses the normalized round alone as the large match heading", () => {
    expect(matchHeading("1/8-finals", "R16")).toBe("Round of 16");
  });

  it("prefers the provider round code when available", () => {
    expect(matchHeading("1/8-finals", "QF")).toBe("Quarter-finals");
  });
});
