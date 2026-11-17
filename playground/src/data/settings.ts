import type { ConfigKey, SettingsGroup, NumericConstraint } from "../types";
export const groups: SettingsGroup[] = [
  {
    title: "Tooltip",
    hint: "Boundary-aware item details on hover and selection.",
    keys: [
      "showTooltip",
      "tooltipPosition",
      "tooltipColor",
      "tooltipBackgroundColor",
      "tooltipBorderRadius",
      "tooltipLineHeight",
      "tooltipPadding",
      "tooltipBorder",
      "tooltipBoxShadow",
      "tooltipWidth",
      "tooltipMaxWidth",
      "tooltipMaxHeight",
    ],
  },
  {
    title: "Layout",
    hint: "Choose views and grid dimensions.",
    keys: [
      "theme",
      "showGrid2d",
      "showGrid3d",
      "grid3dPosition",
      "gridWidth",
      "gridHeight",
    ],
  },
  {
    title: "Coordinates & text",
    hint: "Labels, typography, and coordinate styles.",
    keys: [
      "abscissaType",
      "ordinatesType",
      "fontFamily",
      "itemNameFontSizeRatio",
      "itemCoordinatesFontSizeRatio",
      "itemNameOffsetY",
      "itemCoordinatesOffsetY",
      "coordinatesBackground",
      "coordinatesColor",
      "iconColor",
      "showIcons",
    ],
  },
  {
    title: "Grid & selection",
    hint: "Surface, highlights, and editing handles.",
    keys: [
      "gridFill",
      "gridStroke",
      "gridStrokeWidth",
      "gridHighlightColor",
      "showCrosshair",
      "crosshairBackground",
      "handleFill",
      "handleSize",
      "nonSelectedOpacity",
      "useGradient",
      "useShadow",
    ],
  },
  {
    title: "3D enclosure",
    hint: "The walls around the 3D blueprint.",
    keys: ["showBox", "boxColor", "boxHeight", "boxThickness"],
  },
  {
    title: "Menu & inventory",
    hint: "Try the component’s built-in menus and slots.",
    keys: [
      "showMenu",
      "useAccordionMenu",
      "accordionMenuTitle",
      "showInventory",
      "inventoryTitle",
    ],
  },
];
export const choices: Partial<Record<ConfigKey, readonly string[]>> = {
  theme: ["dark", "light"],
  tooltipPosition: ["top", "bottom", "left", "right"],
  grid3dPosition: ["top", "bottom"],
  abscissaType: ["alphabetic", "numeric"],
  ordinatesType: ["alphabetic", "numeric"],
};
export const numbers: Partial<Record<ConfigKey, NumericConstraint>> = {
  tooltipBorderRadius: { min: 0, max: 80, step: 1 },
  tooltipLineHeight: { min: 0.5, max: 4, step: 0.1 },
  tooltipWidth: { min: 40, max: 1200, step: 10 },
  tooltipMaxWidth: { min: 40, max: 1200, step: 10 },
  tooltipMaxHeight: { min: 40, max: 1200, step: 10 },
  itemNameFontSizeRatio: { min: 0.1, max: 2, step: 0.05 },
  itemCoordinatesFontSizeRatio: { min: 0.1, max: 2, step: 0.05 },
  itemNameOffsetY: { min: -10, max: 10, step: 0.1 },
  itemCoordinatesOffsetY: { min: -10, max: 10, step: 0.1 },
  gridWidth: { min: 4, max: 60, step: 1 },
  gridHeight: { min: 4, max: 60, step: 1 },
  gridStrokeWidth: { min: 0, max: 1, step: 0.01 },
  handleSize: { min: 0.1, max: 1, step: 0.05 },
  nonSelectedOpacity: { min: 0, max: 1, step: 0.05 },
  boxHeight: { min: 0.1, max: 10, step: 0.1 },
  boxThickness: { min: 0.05, max: 3, step: 0.05 },
};

export function label(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace("2d", "2D")
    .replace("3d", "3D");
}
