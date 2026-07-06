export type Route = "call-sheet" | "ideas" | "insights" | "settings" | "idea-tags";

const validRoutes: Route[] = ["call-sheet", "ideas", "insights", "settings", "idea-tags"];

function segments(): string[] {
  return window.location.hash.replace(/^#\//, "").split("/");
}

export function getRoute(): Route {
  const first = segments()[0] as Route;
  return validRoutes.includes(first) ? first : "call-sheet";
}

export function getRouteParam(): string | undefined {
  return segments()[1];
}

export function navigate(route: Route, param?: string): void {
  window.location.hash = param ? `/${route}/${param}` : `/${route}`;
}

export function onRouteChange(cb: (route: Route) => void): void {
  window.addEventListener("hashchange", () => cb(getRoute()));
}
