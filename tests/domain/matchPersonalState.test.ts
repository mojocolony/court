import { describe, expect, it } from "vitest";
import { readMatchPersonalState, writeMatchPersonalState } from "../../src/domain/matchPersonalState";

describe("match personal state", () => {
  it("round-trips star, watch state and note", () => {
    const storage = new Map<string,string>();
    const adapter = {
      get length(){ return storage.size; },
      key:(index:number)=>[...storage.keys()][index]??null,
      getItem:(k:string)=>storage.get(k)??null,
      setItem:(k:string,v:string)=>{storage.set(k,v);},
      removeItem:(k:string)=>{storage.delete(k);}
    };
    writeMatchPersonalState("m1", {starred:true, watchState:"up_next", note:"Watch later", watchedAt:null}, adapter);
    expect(readMatchPersonalState("m1", adapter)).toEqual({starred:true, watchState:"up_next", note:"Watch later", watchedAt:null});
  });

  it("migrates the old boolean watch flag", () => {
    const storage = new Map<string,string>([["court:match:m2", JSON.stringify({starred:false, watch:true, note:""})]]);
    const adapter = {
      get length(){ return storage.size; },
      key:(index:number)=>[...storage.keys()][index]??null,
      getItem:(k:string)=>storage.get(k)??null,
      setItem:(k:string,v:string)=>{storage.set(k,v);}
    };
    expect(readMatchPersonalState("m2", adapter).watchState).toBe("up_next");
  });
});
