import { useEffect, useState } from "preact/hooks";

export type Route = "vault" | "about" | "references";

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (hash === "about") return "about";
  if (hash === "references") return "references";
  return "vault";
}

export function navigate(route: Route): void {
  const target = route === "vault" ? "#/" : `#/${route}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return [route, navigate];
}
