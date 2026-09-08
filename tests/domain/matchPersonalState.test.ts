import { describe, expect, it } from "vitest";
import { readMatchPersonalState, writeMatchPersonalState } from "../../src/domain/matchPersonalState";

describe("match personal state", () => {
  it("round-trips star, watch and note", () => {
    const storage = new Map<string,string>();
    const adapter = { getItem:(k:string)=>storage.get(k)??null, setItem:(k:string,v:string)=>{storage.set(k,v);} };
    writeMatchPersonalState("m1", {starred:true, watch:true, note:"Watch later"}, adapter);
    expect(readMatchPersonalState("m1", adapter)).toEqual({starred:true, watch:true, note:"Watch later"});
  });
});
