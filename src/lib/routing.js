const VALID_VIEWS = new Set(["overview", "projects", "todos"]);

export function readViewFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");
  const id = params.get("id");

  if ((viewParam === "project" || viewParam === "detail") && id) {
    return { view: "detail", projectId: id };
  }

  if (viewParam && VALID_VIEWS.has(viewParam)) {
    return { view: viewParam, projectId: null };
  }

  return { view: "overview", projectId: null };
}

export function writeViewToUrl(view, projectId) {
  const params = new URLSearchParams();

  if (view === "detail" && projectId) {
    params.set("view", "project");
    params.set("id", projectId);
  } else if (view !== "overview") {
    params.set("view", view);
  }

  const qs = params.toString();
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.pushState(null, "", next);
}
