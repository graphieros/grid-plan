import { describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('grid-plan', async importOriginal => ({
    ...await importOriginal(),
    GridPlan: {
        name: 'DemoGrid',
        props: ['config', 'placedItems', 'availableTypes', 'readonly'],
        emits: ['change', 'created', 'delete', 'select', 'unselect', 'selectType'],
        methods: { setActiveType() {}, unselect() {} },
        template: '<div />',
    },
}))

describe('configuration playground', () => {
    test('switches all types to library icons and restores their SVG definitions', async () => {
        const wrapper = mount(App)
        const grid = wrapper.findComponent({ name: 'DemoGrid' })
        const items = JSON.parse(JSON.stringify(grid.props('placedItems')))
        expect(grid.props('availableTypes').every(type => type.icon)).toBe(true)
        expect(grid.vm.$slots.componentIcon).toBeUndefined()
        await wrapper.find('#use-icon-library').setValue(true)
        expect(grid.props('availableTypes').every(type => type.icon === undefined)).toBe(true)
        const item = { typeId: 3, iconColor: '#ffffff' }
        const icon = grid.vm.$slots.componentIcon({ placedItem: item, maxSize: 2, iconColor: '#000000' })[0]
        expect(icon.type).toBe('i')
        expect(icon.props.class).toContain('bi-hdd-rack')
        expect(grid.props('placedItems')).toEqual(items)
        await wrapper.find('#use-icon-library').setValue(false)
        expect(grid.props('availableTypes').every(type => type.icon)).toBe(true)
        expect(grid.vm.$slots.componentIcon).toBeUndefined()
        wrapper.unmount()
    })
    test('preserves created and edited data across config changes', async () => {
        const wrapper = mount(App)
        const grid = wrapper.findComponent({ name: 'DemoGrid' })
        const item = { id: 'new-server', typeId: 3, x: 5, y: 5, w: 2, h: 2, depth: 2.5 }
        grid.vm.$emit('created', item)
        await wrapper.vm.$nextTick()
        grid.vm.$emit('change', { ...item, x: 6, depth: 3 })
        await wrapper.vm.$nextTick()
        await wrapper.find('#setting-gridWidth').setValue('30')
        expect(grid.props('config').gridWidth).toBe(30)
        expect(grid.props('placedItems').find(value => value.id === item.id)).toMatchObject({ x: 6, depth: 3 })
        grid.vm.$emit('delete', item)
        await wrapper.vm.$nextTick()
        expect(grid.props('placedItems').some(value => value.id === item.id)).toBe(false)
        wrapper.unmount()
    })
    test('switches views and restores default config', async () => {
        const wrapper = mount(App)
        const grid = wrapper.findComponent({ name: 'DemoGrid' })
        await wrapper.findAll('.segmented button')[2].trigger('click')
        expect(grid.props('config')).toMatchObject({ showGrid2d: false, showGrid3d: true })
        await wrapper.find('.preview-tools input').setValue(true)
        expect(grid.props('readonly')).toBe(true)
        await wrapper.find('.page-header button').trigger('click')
        expect(grid.props('config')).toMatchObject({ showGrid2d: true, showGrid3d: true })
        expect(grid.props('readonly')).toBe(false)
        wrapper.unmount()
    })
})
