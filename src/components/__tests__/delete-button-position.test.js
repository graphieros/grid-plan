import { describe, expect, test } from 'vitest'
import { positionDeleteButton } from '../../lib/delete-button-position'

describe('delete button placement', () => {
    test.each([
        [{ left: 2, right: 4, top: 2, bottom: 4 }, 'right'],
        [{ left: 18, right: 20, top: 2, bottom: 4 }, 'left'],
        [{ left: 0, right: 20, top: 0, bottom: 2 }, 'bottom'],
        [{ left: 0, right: 20, top: 18, bottom: 20 }, 'top'],
    ])('chooses an available side for %j', (item, side) => {
        const result = positionDeleteButton(item, { width: 20, height: 20 }, 1, 0.3)
        expect(result.side).toBe(side)
        expect(result.x).toBeGreaterThanOrEqual(0)
        expect(result.y).toBeGreaterThanOrEqual(0)
        expect(result.x + 1).toBeLessThanOrEqual(20)
        expect(result.y + 1).toBeLessThanOrEqual(20)
        expect(result.x >= item.right || result.x + 1 <= item.left ||
            result.y >= item.bottom || result.y + 1 <= item.top).toBe(true)
    })
})
