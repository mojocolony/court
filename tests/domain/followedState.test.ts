import { describe, expect, it } from "vitest";
import { followPlayer, isPlayerFollowed, listFollowedPlayers, unfollowPlayer } from "../../src/domain/followedState";

describe("followed players", () => {
  it("stores and removes a followed player", () => {
    const storage = new Map<string,string>();
    const adapter = {
      get length(){ return storage.size; },
      key:(index:number)=>[...storage.keys()][index]??null,
      getItem:(key:string)=>storage.get(key)??null,
      setItem:(key:string,value:string)=>{storage.set(key,value);},
      removeItem:(key:string)=>{storage.delete(key);}
    };
    followPlayer({id:"1",name:"Iga Swiatek",tour:"WTA",ranking:1}, adapter);
    expect(isPlayerFollowed("1", adapter)).toBe(true);
    expect(listFollowedPlayers(adapter)[0]?.name).toBe("Iga Swiatek");
    unfollowPlayer("1", adapter);
    expect(isPlayerFollowed("1", adapter)).toBe(false);
  });
});
