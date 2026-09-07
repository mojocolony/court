export type Route =
  | { name: "today" }
  | { name: "tour" }
  | { name: "players" }
  | { name: "watch" }
  | { name: "match"; id: string }
  | { name: "player"; id: string }
  | { name: "tournament"; id: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  if (!path) return { name: "today" };
  const [name, id] = path.split("/");
  if ((name === "match" || name === "player" || name === "tournament") && id) {
    return { name, id };
  }
  if (name === "tour" || name === "players" || name === "watch") return { name };
  return { name: "today" };
}