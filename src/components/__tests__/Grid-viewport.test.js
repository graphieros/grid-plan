import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import Grid from '../Grid.vue'
import defaults from '../../default_config.json'

describe('2D controls at grid edges', () => {
    test.each([[0, 0], [19, 0], [0, 19], [19, 19]])('keeps buttons and labels inside the viewport at %s, %s', async (x, y) => {
        const item = { id: 'edge', x, y, w: 1, h: 1, description: 'An item with a long description' }
        const wrapper = mount(Grid, { props: { items: [item], activeEntity: item,
            config: { ...defaults, itemNameFontSizeRatio: 1.2, itemCoordinatesFontSizeRatio: 0.8 } } })
        await wrapper.vm.$nextTick()
        const [left, top, width, height] = wrapper.find('svg').attributes('viewBox').split(' ').map(Number)
        const button = wrapper.find('circle')
        expect(Number(button.attributes('cy')) - Number(button.attributes('r'))).toBeGreaterThan(top)
        const labels = wrapper.findAll('.grid-plan-item-info text')
        for (const label of labels) {
            const baseline = Number(label.attributes('y'))
            const font = Number(label.attributes('font-size'))
            expect(baseline + font * 0.3).toBeLessThan(top + height)
            expect(Number(label.attributes('x')) - item.description.length * 1.2 / 2).toBeGreaterThan(left)
            expect(Number(label.attributes('x')) + item.description.length * 1.2 / 2).toBeLessThan(left + width)
        }
        if (y === 19) expect(Number(labels[0].attributes('y')) - 1.2).toBeGreaterThan(21)
        const previous = wrapper.find('svg').attributes('viewBox')
        await wrapper.find('rect[style*="cursor: move"]').trigger('mouseenter')
        expect(wrapper.find('svg').attributes('viewBox')).toBe(previous)
        expect(left + width).toBeGreaterThan(20)
        wrapper.unmount()
    })
})
