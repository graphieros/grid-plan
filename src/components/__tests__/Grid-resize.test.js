import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import Grid from '../Grid.vue'
import defaults from '../../default_config.json'

describe('2D resizing across opposite edges', () => {
    test.each([
        [0, 8, 8, { x: 6, y: 6, w: 2, h: 2 }],
        [1, 2, 8, { x: 2, y: 6, w: 2, h: 2 }],
        [2, 8, 2, { x: 6, y: 2, w: 2, h: 2 }],
        [3, 2, 2, { x: 2, y: 2, w: 2, h: 2 }],
    ])('continues dragging corner %s past both opposite edges', async (corner, x, y, expected) => {
        const item = { id: 'a', x: 4, y: 4, w: 2, h: 2 }
        const wrapper = mount(Grid, { props: { items: [item], activeEntity: item, config: defaults } })
        const svg = wrapper.find('svg')
        svg.element.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y } } })
        svg.element.getScreenCTM = () => ({ inverse() { return {} } })
        await wrapper.findAll('rect[width="0.3"][height="0.3"]')[corner].trigger('mousedown')
        await svg.trigger('mousemove', { clientX: x, clientY: y })
        expect(item).toMatchObject(expected)
        await svg.trigger('mouseup')
        expect(wrapper.emitted('change')?.[0][0]).toMatchObject(expected)
        wrapper.unmount()
    })
    test('rejects an overlap after crossing an edge', async () => {
        const item = { id: 'a', x: 4, y: 4, w: 2, h: 2 }
        const wrapper = mount(Grid, { props: { items: [item, { id: 'b', x: 2, y: 2, w: 1, h: 1 }], activeEntity: item, config: defaults } })
        const svg = wrapper.find('svg')
        svg.element.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y } } })
        svg.element.getScreenCTM = () => ({ inverse() { return {} } })
        await wrapper.findAll('rect[width="0.3"][height="0.3"]')[3].trigger('mousedown')
        await svg.trigger('mousemove', { clientX: 2, clientY: 2 })
        expect(item).toMatchObject({ x: 4, y: 4, w: 2, h: 2 })
        wrapper.unmount()
    })
})
