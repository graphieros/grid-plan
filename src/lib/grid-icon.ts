import type { GridPlanIcon } from "../types";
import { iconPaths } from "../icons";

export function resolveGridIcon(icon: unknown) {
  if (!icon) return null;
  let definition: Exclude<GridPlanIcon, string | string[]>;
  if (typeof icon === "string" && Object.hasOwn(iconPaths, icon)) {
    definition = { paths: iconPaths[icon as keyof typeof iconPaths] };
  } else if (typeof icon === "string" || Array.isArray(icon)) {
    definition = { paths: icon };
  } else if (typeof icon === "object") {
    definition = icon as Exclude<GridPlanIcon, string | string[]>;
  } else return null;

  const paths = (
    Array.isArray(definition.paths) ? definition.paths : [definition.paths]
  ).filter(
    (path) => typeof path === "string" && /^\s*[Mm]\s*[-+.\d]/.test(path),
  );
  if (!paths.length) return null;
  return {
    paths,
    viewBox: definition.viewBox ?? "0 0 24 24",
    fill: definition.fill ?? "none",
    stroke: definition.stroke ?? "currentColor",
    strokeWidth: definition.strokeWidth ?? 1.44,
  };
}
