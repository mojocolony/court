import type { TennisMatch } from './types';

export type WatchState = 'none' | 'up_next' | 'later' | 'watched';

export interface MatchPersonalState {
  starred: boolean;
  watchState: WatchState;
  note: string;
  watchedAt: string | null;
  match?: TennisMatch & { roundCode?: string };
}

export interface MatchPersonalRecord {
  id: string;
  state: MatchPersonalState;
}

interface StorageLike {
  readonly length?: number;
  getItem(key:string): string|null;
  setItem(key:string,value:string): void;
  removeItem?(key:string): void;
  key?(index:number): string|null;
}

const CURRENT_PREFIX = 'baseline:match:';
const LEGACY_PREFIX = 'court:match:';

const empty = (): MatchPersonalState => ({
  starred:false,
  watchState:'none',
  note:'',
  watchedAt:null
});

const currentKey = (id:string) => `${CURRENT_PREFIX}${id}`;
const legacyKey = (id:string) => `${LEGACY_PREFIX}${id}`;

function normalize(raw: unknown): MatchPersonalState {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const legacyWatch = source.watch === true;
  const watchState = source.watchState === 'up_next' || source.watchState === 'later' || source.watchState === 'watched'
    ? source.watchState
    : legacyWatch ? 'up_next' : 'none';
  const match = source.match && typeof source.match === 'object' ? source.match as MatchPersonalState['match'] : undefined;
  return {
    starred: source.starred === true,
    watchState,
    note: typeof source.note === 'string' ? source.note : '',
    watchedAt: typeof source.watchedAt === 'string' ? source.watchedAt : null,
    ...(match ? { match } : {})
  };
}

function parse(value:string|null): MatchPersonalState | null {
  if (!value) return null;
  try { return normalize(JSON.parse(value)); } catch { return null; }
}

export function readMatchPersonalState(id:string, storage:StorageLike = localStorage): MatchPersonalState {
  const current = parse(storage.getItem(currentKey(id)));
  if (current) return current;
  const legacy = parse(storage.getItem(legacyKey(id)));
  if (!legacy) return empty();
  storage.setItem(currentKey(id), JSON.stringify(legacy));
  return legacy;
}

export function writeMatchPersonalState(id:string, state:MatchPersonalState, storage:StorageLike = localStorage): void {
  storage.setItem(currentKey(id), JSON.stringify(normalize(state)));
}

export function listMatchPersonalRecords(storage:StorageLike = localStorage): MatchPersonalRecord[] {
  const ids = new Set<string>();
  const length = storage.length ?? 0;
  if (storage.key) {
    for (let index = 0; index < length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(CURRENT_PREFIX)) ids.add(key.slice(CURRENT_PREFIX.length));
      else if (key?.startsWith(LEGACY_PREFIX)) ids.add(key.slice(LEGACY_PREFIX.length));
    }
  }
  return [...ids].map(id => ({ id, state: readMatchPersonalState(id, storage) }));
}

export function watchStateIsProtected(state: MatchPersonalState): boolean {
  return state.watchState === 'up_next' || state.watchState === 'later';
}
