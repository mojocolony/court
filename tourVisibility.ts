export function isMainTourMatch(match: { tour: string }): boolean {
  return match.tour === "ATP" || match.tour === "WTA";
}
