export function matchHeading(round?: string, roundCode?: string): string {
  const code = String(roundCode ?? "").trim().toUpperCase();
  if (code === "R16") return "Round of 16";
  if (code === "QF") return "Quarter-finals";
  if (code === "SF") return "Semi-finals";
  if (code === "F") return "Final";

  const raw = String(round ?? "").trim();
  const key = raw.toLowerCase();
  if (key === "1/8-finals" || key === "round of 16" || key === "r16") return "Round of 16";
  if (key === "1/4-finals" || key === "quarter-finals" || key === "quarterfinals" || key === "qf") return "Quarter-finals";
  if (key === "1/2-finals" || key === "semi-finals" || key === "semifinals" || key === "sf") return "Semi-finals";
  if (key === "final" || key === "f") return "Final";
  return raw || "Match";
}
