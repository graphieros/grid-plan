// All coordinates are relative to the owning map. Prefer an unchanged,
// centered tooltip; if none fits, constrain its size on the roomiest side.
export function positionTooltip(anchor, boundary, size, preferred = 'top', gap = 10, padding = 8) {
  const cx = (anchor.left + anchor.right) / 2;
  const cy = (anchor.top + anchor.bottom) / 2;
  const horizontal = Math.max(0, 2 * Math.min(cx - padding, boundary.width - padding - cx));
  const vertical = Math.max(0, 2 * Math.min(cy - padding, boundary.height - padding - cy));
  const rooms = {
    top: { width: horizontal, height: Math.max(0, anchor.top - gap - padding) },
    bottom: { width: horizontal, height: Math.max(0, boundary.height - padding - anchor.bottom - gap) },
    left: { width: Math.max(0, anchor.left - gap - padding), height: vertical },
    right: { width: Math.max(0, boundary.width - padding - anchor.right - gap), height: vertical },
  };
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const first = opposite[preferred] ? preferred : 'top';
  const order = [...new Set([first, opposite[first], 'top', 'bottom', 'right', 'left'])];
  let side = order.find(side => size.width <= rooms[side].width && size.height <= rooms[side].height);
  if (!side) side = order.reduce((best, side) => {
    const area = room => Math.min(size.width, room.width) * Math.min(size.height, room.height);
    return area(rooms[side]) > area(rooms[best]) ? side : best;
  }, first);
  const room = rooms[side];
  const width = Math.min(size.width, room.width);
  const height = Math.min(size.height, room.height);
  return {
    side, maxWidth: room.width, maxHeight: room.height,
    left: side === 'left' ? anchor.left - gap - width : side === 'right' ? anchor.right + gap : cx - width / 2,
    top: side === 'top' ? anchor.top - gap - height : side === 'bottom' ? anchor.bottom + gap : cy - height / 2,
  };
}
