import values from "./default_config";
import { useNestedProp } from "./lib";

export type GridPlanTheme = "dark" | "light";

export type GridPlanCoordinateType = "alphabetic" | "numeric";
export type GridPlanTooltipPosition = "top" | "bottom" | "left" | "right";
type LengthSetting =
  | "tooltipBorderRadius"
  | "tooltipLineHeight"
  | "tooltipPadding"
  | "tooltipWidth"
  | "tooltipMaxWidth"
  | "tooltipMaxHeight";

/** Configuration keys follow the runtime defaults, so generated types cannot drift. */
export type GridPlanConfig = {
  [K in keyof typeof values]?: K extends "theme"
    ? GridPlanTheme
    : K extends "abscissaType" | "ordinatesType"
      ? GridPlanCoordinateType
      : K extends "grid3dPosition"
        ? "top" | "bottom"
        : K extends "tooltipPosition"
          ? GridPlanTooltipPosition
          : K extends LengthSetting
            ? number | string
            : (typeof values)[K];
};
export type GridPlanResolvedConfig = Required<GridPlanConfig>;
export const defaultConfig: GridPlanResolvedConfig = values;

const lightPalette: GridPlanConfig = {
  coordinatesBackground: "#E2E8F0",
  coordinatesColor: "#475569",
  crosshairBackground: "#E2E8F0",
  gridFill: "#F8FAFC",
  gridStroke: "#CBD5E1",
  gridHighlightColor: "#3A3A3A",
  handleFill: "#3A3A3A",
  iconColor: "#334155",
  boxColor: "#CBD5E1",
  tooltipColor: "#1E293B",
  tooltipBackgroundColor: "#FFFFFFF2",
  tooltipBorder: "1px solid #CBD5E1",
  tooltipBoxShadow: "0 4px 16px #0f172a26",
};

/** Resolve theme defaults first, then apply explicit configuration overrides. */
export function resolveConfig(
  config: GridPlanConfig = {},
): GridPlanResolvedConfig {
  return useNestedProp({
    defaultConfig: {
      ...defaultConfig,
      ...(config.theme === "light" ? lightPalette : {}),
    },
    userConfig: config,
  });
}
