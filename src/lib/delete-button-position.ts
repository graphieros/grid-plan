import type { TooltipAnchor, TooltipSize } from "./tooltip-position";

/** Prefer the right edge, then another side that can contain the full button. */
export function positionDeleteButton(
  item: TooltipAnchor,
  bounds: TooltipSize,
  size: number,
  gap: number,
) {
  const rooms = {
    right: bounds.width - item.right,
    left: item.left,
    bottom: bounds.height - item.bottom,
    top: item.top,
  };
  const sides = ["right", "left", "bottom", "top"] as const;
  const side =
    sides.find((side) => rooms[side] >= size + gap) ??
    sides.reduce((best, side) => (rooms[side] > rooms[best] ? side : best));
  const clamp = (value: number, limit: number) =>
    Math.max(0, Math.min(value, limit - size));
  return {
    side,
    x:
      side === "right"
        ? item.right + gap
        : side === "left"
          ? item.left - gap - size
          : clamp(item.right - size, bounds.width),
    y:
      side === "bottom"
        ? item.bottom + gap
        : side === "top"
          ? item.top - gap - size
          : clamp(item.top, bounds.height),
  };
}
