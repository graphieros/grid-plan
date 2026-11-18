import { computed } from "vue";
import { formatCoordinate } from "../lib/coordinates";
import type { GridPlanResolvedConfig, GridPlanPlacedItem } from "../types";

export function useGridCoordinates(config: () => GridPlanResolvedConfig) {
  const gridCoordinates = computed(() => {
    const c = config();
    const axis = (size: number, alphabetic: boolean) => {
      const labels: (string | number)[] = [];
      for (let i = 1; i <= size; i++)
        labels.push(alphabetic ? formatCoordinate(i - 1, "alphabetic") : i);
      return labels;
    };
    return {
      abs: axis(c.gridWidth, c.abscissaType === "alphabetic"),
      ord: axis(c.gridHeight, c.ordinatesType === "alphabetic"),
    };
  });

  function itemCoordinates(item: GridPlanPlacedItem | null | undefined) {
    if (!item) return "";
    const { abs, ord } = gridCoordinates.value;
    const start = `${abs[item.x]}-${ord[item.y]}`;
    return item.h === 1 && item.w === 1
      ? start
      : `${start}, ${abs[item.x + item.w - 1]}-${ord[item.y + item.h - 1]}`;
  }

  function displayCoordinates(item: GridPlanPlacedItem) {
    const { abs, ord } = gridCoordinates.value;
    return {
      x: String(abs[item.x]),
      y: String(ord[item.y]),
      label: itemCoordinates(item),
    };
  }

  return { gridCoordinates, itemCoordinates, displayCoordinates };
}
