import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import GridPlan from '../GridPlan.vue'
import defaults from '../../default_config.json'

// Browser selection releases the pointer before dispatching click. A plain
// mouseup must not emit change and cause GridPlan to replace the clicked SVG.
describe('2D selection', () => {
    test.each([false, true])('preserves the clicked item until selection (readonly: %s)', async readonly => {
        const wrapper = mount(GridPlan, {
            slots: { deleteIcon: '<svg data-custom-delete="true"><title>{{ params.item.id }}</title></svg>' },
            props: {
                config: { showGrid3d: false, showMenu: false, showInventory: false },
                availableTypes: [{ typeId: 1, description: 'Server', color: '#3366dd' }],
                placedItems: [{ id: 'server', typeId: 1, x: 2, y: 2, w: 2, h: 2 }],
                readonly,
            },
        })
        await wrapper.vm.$nextTick()
        const cell = wrapper.find('rect[x="0"][y="0"][width="1"][height="1"]')
        await cell.trigger('mouseover')
        expect(wrapper.findAll(`rect[fill="${defaults.crosshairBackground}"]`).length > 0).toBe(!readonly)
        expect(wrapper.findAll('text').some(text => text.text() === 'A-1')).toBe(!readonly)
        expect(wrapper.find('rect[fill="#FFFFFF20"]').exists()).toBe(!readonly)
        await cell.trigger('mouseleave')
        const item = wrapper.find('rect[x="2"][y="2"][width="2"][height="2"]')
        const element = item.element
        await item.trigger('mouseenter')
        expect(wrapper.find('.grid-plan-item-info').text()).toContain('Server')
        expect(wrapper.find('.grid-plan-item-info').text()).toContain('C-3, D-4')
        expect(wrapper.emitted('select')).toBeUndefined()
        expect(wrapper.vm.getActiveItem()).toEqual({})
        await item.trigger('mouseleave')
        expect(wrapper.find('.grid-plan-item-info').exists()).toBe(false)
        await item.trigger('mousedown')
        await item.trigger('mouseup')
        expect(wrapper.emitted('change')).toBeUndefined()
        expect(wrapper.element.contains(element)).toBe(true)
        await item.trigger('click')
        expect(wrapper.emitted('select')?.[0][0]).toMatchObject({ id: 'server' })
        expect(wrapper.vm.getActiveItem().id).toBe('server')
        expect(wrapper.find('[data-custom-delete]').exists()).toBe(!readonly)
        if (!readonly) expect(wrapper.find('[data-custom-delete] title').text()).toBe('server')
        await wrapper.setProps({ config: { ...wrapper.props('config'), itemNameFontSizeRatio: 0.7, itemCoordinatesFontSizeRatio: 0.3 } })
        const info = wrapper.findAll('.grid-plan-item-info text')
        expect(info[0].attributes('font-size')).toBe('0.7')
        expect(info[1].attributes('font-size')).toBe('0.3')
        expect(Number(info[0].attributes('y'))).toBeCloseTo(5.2)
        expect(Number(info[1].attributes('y'))).toBeCloseTo(5.8)
        const active = wrapper.find('rect[x="2"][y="2"][width="2"][height="2"]')
        const svg = wrapper.find('svg').element
        svg.createSVGPoint = () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y } } })
        svg.getScreenCTM = () => ({ inverse() { return {} } })
        await active.trigger('mousedown', { clientX: 100, clientY: 100 })
        await active.trigger('mouseup', { clientX: 100, clientY: 100 })
        expect(wrapper.emitted('change')).toBeUndefined()
        await active.trigger('click')
        expect(wrapper.emitted('unselect')).toHaveLength(1)
        expect(wrapper.vm.getActiveItem()).toEqual({})
        wrapper.unmount()
    })
})
