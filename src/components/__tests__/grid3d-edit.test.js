import { describe, test, expect } from 'vitest'
import { canPlace, editFootprint } from '../../lib/grid3d-edit'

const grid = { gridWidth: 10, gridHeight: 10 }
const item = { id: 'a', x: 2, y: 2, w: 3, h: 3 }

describe('3D editing geometry', () => {
    test('snaps movement and clamps it to the grid', () => {
        expect(editFootprint(item, { x: 20, y: -2 }, null, grid)).toEqual({ x: 7, y: 0, w: 3, h: 3 })
        expect(editFootprint(item, { x: 3.6, y: 4.2 }, null, grid)).toEqual({ x: 4, y: 4, w: 3, h: 3 })
    })
    test.each([
        ['top-left', { x: 1, y: 1, w: 4, h: 4 }],
        ['top-right', { x: 1, y: 1, w: 1, h: 4 }],
        ['bottom-left', { x: 1, y: 1, w: 4, h: 1 }],
        ['bottom-right', { x: 1, y: 1, w: 1, h: 1 }],
    ])('resizes from %s with the opposite corner fixed', (handle, result) => {
        expect(editFootprint(item, { x: 1, y: 1 }, handle, grid)).toEqual(result)
    })
    test('keeps resizing within bounds and at least one cell wide', () => {
        expect(editFootprint(item, { x: 50, y: 50 }, 'top-left', grid)).toEqual({ x: 5, y: 5, w: 5, h: 5 })
        expect(editFootprint(item, { x: 50, y: 50 }, 'bottom-right', grid)).toEqual({ x: 2, y: 2, w: 8, h: 8 })
    })
    test('can cross either axis independently and reverse direction around the same anchor', () => {
        expect(editFootprint(item, { x: 7, y: 1 }, 'bottom-left', grid)).toEqual({ x: 5, y: 1, w: 2, h: 1 })
        expect(editFootprint(item, { x: 3, y: 7 }, 'bottom-left', grid)).toEqual({ x: 3, y: 2, w: 2, h: 5 })
        expect(editFootprint(item, { x: 5, y: 2 }, 'bottom-left', grid)).toEqual({ x: 4, y: 2, w: 1, h: 1 })
    })
    test('rejects collisions and overflow but allows touching edges and ignores the edited item', () => {
        const items = [item, { id: 'b', x: 5, y: 2, w: 2, h: 2 }]
        expect(canPlace(item, items, grid)).toBe(true)
        expect(canPlace({ ...item, x: 3 }, items, grid)).toBe(false)
        expect(canPlace({ ...item, x: -1 }, items, grid)).toBe(false)
        expect(canPlace({ ...item, x: 9 }, items, grid)).toBe(false)
    })
})
