import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import Grid from '../Grid.vue'
import originalDefaults from '../../default_config'
const defaults = { ...originalDefaults, showTooltip: false }

describe('2D active item rendering', () => {
    test('renders only the moving item and its decorations, without the old placement', async () => {
        const item = { id: 'server', typeId: 1, x: 2, y: 2, w: 2, h: 2,
            description: 'Server', texture: { src: '/texture.png' } }
        // A selected item can be a separate object from its placed-item snapshot.
        const active = reactive({ ...item })
        const wrapper = mount(Grid, {
            props: { items: [item], activeEntity: active, config: { ...defaults } },
            slots: { componentText: '{{ params.placedItem.description }}' },
        })
        const svg = wrapper.find('svg')
        svg.element.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y } } })
        svg.element.getScreenCTM = () => ({ inverse() { return {} } })
        const shape = () => wrapper.findAll('rect').filter(rect => rect.attributes('fill') === 'url(#grid-plan-texture-server)')
        expect(shape()).toHaveLength(1)
        expect(wrapper.findAll('pattern')).toHaveLength(1)
        expect(wrapper.findAll('text[font-size="0.6"]').filter(text => text.text() === 'Server')).toHaveLength(1)
        await shape()[0].trigger('mousedown', { clientX: 3, clientY: 3 })
        await svg.trigger('mousemove', { clientX: 6, clientY: 6 })
        expect(shape()).toHaveLength(1)
        expect(shape()[0].attributes()).toMatchObject({ x: '5', y: '5' })
        expect(item.x).toBe(2)
        expect(wrapper.findAll('rect[fill="url(#entityGradient)"]')).toHaveLength(1)
        const label = wrapper.findAll('text[font-size="0.6"]').find(text => text.text() === 'Server')
        expect(label.attributes('x')).toBe('6')
        await svg.trigger('mouseup')
        expect(wrapper.emitted('change')?.[0][0]).toMatchObject({ x: 5, y: 5 })
        wrapper.unmount()
    })
})

describe('2D drag grab position', () => {
    test.each([
        [{ x: 2, y: 1, w: 12, h: 1 }, { x: 0, y: 0, w: 2, h: 1 }, [42, 30], [42, 10], { x: 2, y: 0 }],
        [{ x: 1, y: 2, w: 1, h: 12 }, { x: 0, y: 0, w: 1, h: 2 }, [30, 42], [10, 42], { x: 0, y: 2 }],
    ])('preserves the grab offset for a rectangular item %j', async (size, neighbor, start, end, expected) => {
        const item = { id: 'moving', ...size }
        const wrapper = mount(Grid, { props: {
            items: [item, { id: 'neighbor', ...neighbor }], activeEntity: item, config: defaults,
        } })
        const svg = wrapper.find('svg')
        svg.element.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x / 20, y: this.y / 20 } } })
        svg.element.getScreenCTM = () => ({ inverse() { return {} } })
        const active = wrapper.find('rect[style*="cursor: move"]')
        await active.trigger('mousedown', { clientX: start[0], clientY: start[1] })
        await svg.trigger('mousemove', { clientX: end[0], clientY: end[1] })
        expect(item).toMatchObject({ ...expected, w: size.w, h: size.h })
        await svg.trigger('mouseup')
        expect(wrapper.emitted('change')?.[0][0]).toMatchObject(expected)
        wrapper.unmount()
    })
})


describe('reactive 2D props', () => {
    test('refreshes handles, selection and dimensions without remounting', async () => {
        const first = { id: 'a', typeId: 1, x: 1, y: 1, w: 2, h: 2 }
        const wrapper = mount(Grid, { props: { items: [first], activeEntity: first, config: { ...defaults } } })
        const vm = wrapper.vm
        const second = { id: 'b', typeId: 1, x: 5, y: 6, w: 1, h: 1 }
        await wrapper.setProps({ items: [second], activeEntity: second,
            config: { ...defaults, handleFill: '#123456', handleSize: 0.7, gridWidth: 30, gridHeight: 25 } })
        expect(wrapper.vm).toBe(vm)
        const handles = wrapper.findAll('rect[fill="#123456"]')
        expect(handles).toHaveLength(4)
        expect(handles[0].attributes('width')).toBe('0.7')
        expect(wrapper.find('rect[style*="cursor: move"]').attributes()).toMatchObject({ x: '5', y: '6' })
        expect(wrapper.findAll(`rect[fill="${defaults.gridFill}"]`)).toHaveLength(30 * 25)
        wrapper.unmount()
    })
})
