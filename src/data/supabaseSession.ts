export interface StoredSupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: { id?: string };
}

function projectRef(url:string): string | null {
  try {
    const host = new URL(url).hostname;
    const [ref] = host.split('.');
    return ref || null;
  } catch { return null; }
}

export function supabaseSessionKey(url:string): string {
  const ref = projectRef(url);
  return ref ? `sb-${ref}-auth-token` : 'sb-auth-token';
}

export function parseStoredSupabaseSession(raw:string|null): StoredSupabaseSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const candidate = parsed?.currentSession && typeof parsed.currentSession === 'object'
      ? parsed.currentSession as Record<string, unknown>
      : parsed;
    if (typeof candidate.access_token !== 'string' || !candidate.access_token) return null;
    return {
      access_token: candidate.access_token,
      refresh_token: typeof candidate.refresh_token === 'string' ? candidate.refresh_token : undefined,
      expires_at: typeof candidate.expires_at === 'number' ? candidate.expires_at : undefined,
      user: candidate.user && typeof candidate.user === 'object'
        ? { id: typeof (candidate.user as Record<string, unknown>).id === 'string' ? String((candidate.user as Record<string, unknown>).id) : undefined }
        : undefined
    };
  } catch { return null; }
}

export async function readOrRefreshSharedSession(url:string, anonKey:string, storage:Storage = localStorage): Promise<StoredSupabaseSession|null> {
  const key = supabaseSessionKey(url);
  const current = parseStoredSupabaseSession(storage.getItem(key));
  if (!current) return null;
  const expiresSoon = typeof current.expires_at === 'number' && current.expires_at * 1000 <= Date.now() + 60_000;
  if (!expiresSoon || !current.refresh_token) return current;

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
      method:'POST',
      headers:{ apikey:anonKey, 'Content-Type':'application/json' },
      body:JSON.stringify({ refresh_token: current.refresh_token })
    });
    if (!response.ok) return null;
    const refreshed = await response.json() as StoredSupabaseSession;
    if (!refreshed?.access_token) return null;
    storage.setItem(key, JSON.stringify(refreshed));
    return refreshed;
  } catch { return null; }
}
