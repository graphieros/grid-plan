import { describe, expect, test } from "vitest";
import { positionTooltip } from "../../lib/tooltip-position";

const bounds = { width: 400, height: 300 };
const size = { width: 100, height: 50 };
describe("tooltip placement", () => {
  test.each([
    ["top", { left: 150, right: 250, top: 100, bottom: 140 }, "top"],
    ["top", { left: 150, right: 250, top: 10, bottom: 50 }, "bottom"],
    ["bottom", { left: 150, right: 250, top: 240, bottom: 280 }, "top"],
    ["right", { left: 350, right: 390, top: 100, bottom: 140 }, "left"],
    ["left", { left: 10, right: 50, top: 100, bottom: 140 }, "right"],
  ])("flips %s to %s when needed", (preferred, anchor, side) => {
    const result = positionTooltip(anchor, bounds, size, preferred);
    expect(result.side).toBe(side);
    if (side === "top" || side === "bottom")
      expect(result.left + size.width / 2).toBe(
        (anchor.left + anchor.right) / 2,
      );
    else
      expect(result.top + size.height / 2).toBe(
        (anchor.top + anchor.bottom) / 2,
      );
  });
  test.each([
    { left: 10, right: 30, top: 10, bottom: 30 },
    { left: 370, right: 390, top: 10, bottom: 30 },
    { left: 10, right: 30, top: 270, bottom: 290 },
    { left: 370, right: 390, top: 270, bottom: 290 },
  ])(
    "constrains oversized content within the boundary while retaining centering at %j",
    (anchor) => {
      const oversized = { width: 600, height: 500 };
      const result = positionTooltip(anchor, bounds, oversized);
      const width = Math.min(oversized.width, result.maxWidth);
      const height = Math.min(oversized.height, result.maxHeight);
      expect(result.left).toBeGreaterThanOrEqual(8);
      expect(result.top).toBeGreaterThanOrEqual(8);
      expect(result.left + width).toBeLessThanOrEqual(392);
      expect(result.top + height).toBeLessThanOrEqual(292);
      if (["left", "right"].includes(result.side))
        expect(result.top + height / 2).toBe((anchor.top + anchor.bottom) / 2);
      else
        expect(result.left + width / 2).toBe((anchor.left + anchor.right) / 2);
    },
  );
});
