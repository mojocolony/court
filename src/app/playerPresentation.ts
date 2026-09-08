import type { CourtPlayer } from "../data/courtApi";

const countryNames: Record<string, string> = {
  arg:"Argentina", aus:"Australia", aut:"Austria", bel:"Belgium", blr:"Belarus", bra:"Brazil",
  bul:"Bulgaria", can:"Canada", chi:"Chile", chn:"China", col:"Colombia", cro:"Croatia",
  cze:"Czechia", den:"Denmark", ecu:"Ecuador", egy:"Egypt", esp:"Spain", est:"Estonia",
  fin:"Finland", fra:"France", gbr:"Great Britain", geo:"Georgia", ger:"Germany", gre:"Greece",
  hun:"Hungary", ind:"India", irl:"Ireland", isr:"Israel", ita:"Italy", jpn:"Japan",
  kaz:"Kazakhstan", kor:"South Korea", lat:"Latvia", ltu:"Lithuania", mar:"Morocco", mex:"Mexico",
  ned:"Netherlands", nor:"Norway", nzl:"New Zealand", pol:"Poland", por:"Portugal", rou:"Romania",
  rsa:"South Africa", rus:"Russia", srb:"Serbia", sui:"Switzerland", svk:"Slovakia", slo:"Slovenia",
  swe:"Sweden", tpe:"Chinese Taipei", tun:"Tunisia", tur:"Türkiye", ukr:"Ukraine", uru:"Uruguay",
  usa:"United States", wor:"World"
};

export function handDisplayName(value?: string) {
  const hand = String(value ?? "").trim().toLowerCase();
  if (!hand) return "";
  if (hand === "r" || hand === "right" || hand === "right-handed") return "Right-handed";
  if (hand === "l" || hand === "left" || hand === "left-handed") return "Left-handed";
  return value ?? "";
}

export function countryDisplayName(value?: string) {
  const code = String(value ?? "").trim();
  if (!code) return "";
  const lower = code.toLowerCase();
  if (countryNames[lower]) return countryNames[lower];
  if (/^[a-z]{2}$/i.test(code)) {
    try { return new Intl.DisplayNames(["en"], { type:"region" }).of(code.toUpperCase()) ?? code.toUpperCase(); }
    catch { /* fall through */ }
  }
  return code.toUpperCase();
}

function richness(player: CourtPlayer) {
  return (player.ranking ? 8 : 0) + (player.rankingPoints ? 4 : 0) + (player.birthday ? 2 : 0) +
    (player.hand ? 2 : 0) + (player.countryCode ? 1 : 0);
}

export function dedupePlayers(players: CourtPlayer[]) {
  const byIdentity = new Map<string, CourtPlayer>();
  for (const player of players) {
    const key = `${player.tour}|${player.name.trim().toLocaleLowerCase()}|${String(player.countryCode ?? "").toLocaleLowerCase()}`;
    const existing = byIdentity.get(key);
    if (!existing || richness(player) > richness(existing)) byIdentity.set(key, player);
  }
  return [...byIdentity.values()];
}
