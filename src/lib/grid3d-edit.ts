import type {
  GridPlanFootprint,
  GridPlanPoint,
  GridPlanResizeHandle,
  GridPlanResolvedConfig,
} from "../types";
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function resizeAxis(
  anchor: number,
  coordinate: number,
  limit: number,
  lowerEdge: boolean,
) {
  let edge = clamp(Math.round(coordinate), 0, limit);
  // Retain a one-cell footprint at the anchor; once crossed, the dragged
  // edge becomes the opposite edge without changing the fixed corner.
  if (edge === anchor) edge += lowerEdge ? -1 : 1;
  return { start: Math.min(anchor, edge), size: Math.abs(edge - anchor) };
}

export function editFootprint(
  item: GridPlanFootprint,
  point: GridPlanPoint,
  handle: GridPlanResizeHandle | null | undefined,
  grid: Pick<GridPlanResolvedConfig, "gridWidth" | "gridHeight">,
) {
  if (!handle) {
    return {
      x: clamp(Math.round(point.x), 0, grid.gridWidth - item.w),
      y: clamp(Math.round(point.y), 0, grid.gridHeight - item.h),
      w: item.w,
      h: item.h,
    };
  }
  const left = handle.endsWith("left");
  const top = handle.startsWith("top");
  const horizontal = resizeAxis(
    left ? item.x + item.w : item.x,
    point.x,
    grid.gridWidth,
    left,
  );
  const vertical = resizeAxis(
    top ? item.y + item.h : item.y,
    point.y,
    grid.gridHeight,
    top,
  );
  return {
    x: horizontal.start,
    y: vertical.start,
    w: horizontal.size,
    h: vertical.size,
  };
}

export function canPlace(
  item: GridPlanFootprint & { id?: string | number },
  items: (GridPlanFootprint & { id?: string | number })[],
  grid: Pick<GridPlanResolvedConfig, "gridWidth" | "gridHeight">,
) {
  return (
    item.w >= 1 &&
    item.h >= 1 &&
    item.x >= 0 &&
    item.y >= 0 &&
    item.x + item.w <= grid.gridWidth &&
    item.y + item.h <= grid.gridHeight &&
    !items.some(
      (other) =>
        other.id !== item.id &&
        item.x < other.x + other.w &&
        item.x + item.w > other.x &&
        item.y < other.y + other.h &&
        item.y + item.h > other.y,
    )
  );
}
