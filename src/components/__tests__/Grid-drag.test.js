import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import Grid from '../Grid.vue'
import defaults from '../../default_config.json'

describe('2D active item rendering', () => {
    test('renders only the moving item and its decorations, without the old placement', async () => {
        const item = { id: 'server', typeId: 1, x: 2, y: 2, w: 2, h: 2,
            description: 'Server', texture: { src: '/texture.png' } }
        // A selected item can be a separate object from its placed-item snapshot.
        const active = { ...item }
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
        await shape()[0].trigger('mousedown')
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
