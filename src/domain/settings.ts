export interface BaselineSettings {
  globalSpoilerMode: boolean;
}

interface StorageLike {
  getItem(key:string): string|null;
  setItem(key:string,value:string): void;
}

const KEY = 'baseline:settings';
const defaults = ():BaselineSettings => ({ globalSpoilerMode:false });

export function readBaselineSettings(storage:StorageLike = localStorage):BaselineSettings {
  const raw=storage.getItem(KEY);
  if(!raw) return defaults();
  try {
    const parsed=JSON.parse(raw) as Record<string,unknown>;
    return { globalSpoilerMode:parsed.globalSpoilerMode===true };
  } catch { return defaults(); }
}

export function writeBaselineSettings(settings:BaselineSettings, storage:StorageLike = localStorage):void {
  storage.setItem(KEY, JSON.stringify({ globalSpoilerMode:settings.globalSpoilerMode===true }));
}
