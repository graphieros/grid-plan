import type { GridPlanCoordinateType } from "../config";

/** Convert a zero-based position to a one-based numeric or alphabetic label. */
export function formatCoordinate(
  index: number,
  type: GridPlanCoordinateType,
): string {
  if (
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index === Number.MAX_SAFE_INTEGER
  )
    throw new RangeError(
      "Coordinate index must be a non-negative safe integer below Number.MAX_SAFE_INTEGER.",
    );
  if (type === "numeric") return String(index + 1);
  if (type !== "alphabetic") throw new TypeError("Unknown coordinate type.");
  let value = index + 1;
  let label = "";
  while (value > 0) {
    label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

/** Decode a display label to a zero-based position; reject invalid input. */
export function parseCoordinate(
  label: string,
  type: GridPlanCoordinateType,
): number {
  if (typeof label !== "string")
    throw new TypeError("Coordinate label must be a string.");
  const text = label.trim().toUpperCase();
  let value = 0;
  if (type === "numeric") {
    if (!/^[1-9]\d*$/.test(text))
      throw new RangeError("Numeric coordinates must be positive integers.");
    value = Number(text);
  } else if (type === "alphabetic") {
    if (!/^[A-Z]+$/.test(text))
      throw new RangeError("Alphabetic coordinates must contain letters only.");
    for (const letter of text) {
      value = value * 26 + (letter.charCodeAt(0) - 64);
      if (!Number.isSafeInteger(value))
        throw new RangeError("Coordinate exceeds the safe integer range.");
    }
  } else throw new TypeError("Unknown coordinate type.");
  if (!Number.isSafeInteger(value))
    throw new RangeError("Coordinate exceeds the safe integer range.");
  return value - 1;
}
