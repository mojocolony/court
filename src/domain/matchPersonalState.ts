export interface MatchPersonalState { starred: boolean; watch: boolean; note: string; }
interface StorageLike { getItem(key:string): string|null; setItem(key:string,value:string): void; }
const empty = (): MatchPersonalState => ({ starred:false, watch:false, note:"" });
const key = (id:string) => `court:match:${id}`;
export function readMatchPersonalState(id:string, storage:StorageLike = localStorage): MatchPersonalState {
  try { return { ...empty(), ...JSON.parse(storage.getItem(key(id)) ?? "{}") }; } catch { return empty(); }
}
export function writeMatchPersonalState(id:string, state:MatchPersonalState, storage:StorageLike = localStorage): void {
  storage.setItem(key(id), JSON.stringify(state));
}
