import { describe, expect, it } from "vitest";
import { parseRoute } from "../../src/app/routes";

describe("parseRoute", () => {
  it("defaults to Today", () => expect(parseRoute("")).toEqual({ name: "today" }));
  it("parses a player route", () => expect(parseRoute("#/player/p123")).toEqual({ name: "player", id: "p123" }));
});