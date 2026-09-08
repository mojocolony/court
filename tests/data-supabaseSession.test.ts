import { describe, expect, it } from "vitest";
import { parseStoredSupabaseSession, supabaseSessionKey } from "../src/data/supabaseSession";

describe("shared Supabase session", () => {
  it("uses the project auth storage key", () => {
    expect(supabaseSessionKey("https://appesztafatypbxzdunr.supabase.co")).toBe("sb-appesztafatypbxzdunr-auth-token");
  });

  it("parses direct and wrapped session shapes", () => {
    expect(parseStoredSupabaseSession(JSON.stringify({access_token:"a",user:{id:"u"}}))?.user?.id).toBe("u");
    expect(parseStoredSupabaseSession(JSON.stringify({currentSession:{access_token:"b",user:{id:"v"}}}))?.access_token).toBe("b");
  });
});
