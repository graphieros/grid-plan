import { describe, test, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import GridPlan from '../GridPlan.vue'

const { load3d } = vi.hoisted(() => ({ load3d: vi.fn() }))

vi.mock('../Grid3d.vue', () => {
    load3d()
    return { __esModule: true, default: { template: '<div class="test-grid-3d" />' } }
})

describe('optional 3D layout', () => {
    test('loads the 3D component only after the layout is enabled', async () => {
        const wrapper = mount(GridPlan, {
            props: {
                availableTypes: [{ typeId: 1, description: 'Server', color: '#cccccc' }],
                config: { showGrid3d: false },
            },
            global: { stubs: { Grid: true } },
        })

        await flushPromises()
        expect(load3d).not.toHaveBeenCalled()
        expect(wrapper.find('.test-grid-3d').exists()).toBe(false)

        await wrapper.setProps({ config: { showGrid3d: true, grid3dPosition: 'top' } })
        await flushPromises()
        expect(load3d).toHaveBeenCalledOnce()
        expect(wrapper.find('.test-grid-3d').exists()).toBe(true)

        await wrapper.setProps({ config: { showGrid2d: false, showGrid3d: true } })
        expect(wrapper.find('grid-stub').exists()).toBe(false)
        expect(wrapper.find('.test-grid-3d').exists()).toBe(true)

        const grid3d = wrapper.findComponent({ name: 'AsyncComponentWrapper' })
        grid3d.vm.$emit('triggerAction', { x: 2, y: 3 })
        await flushPromises()
        const created = wrapper.emitted('created')[0][0]
        expect(created).toMatchObject({ x: 2, y: 3, w: 1, h: 1, typeId: 1 })
        grid3d.vm.$emit('change', created)
        expect(wrapper.emitted('change')[0]).toEqual([created])
        grid3d.vm.$emit('delete', created)
        expect(wrapper.emitted('delete')[0]).toEqual([created])

        await wrapper.setProps({ config: { showGrid3d: true, grid3dPosition: 'bottom' } })
        expect(wrapper.find('.test-grid-3d').exists()).toBe(true)

        await wrapper.setProps({ config: { showGrid3d: false } })
        expect(wrapper.find('.test-grid-3d').exists()).toBe(false)
        wrapper.unmount()
    })
})


test('config and type updates preserve live items and selection', async () => {
    const wrapper = mount(GridPlan, {
        props: { availableTypes: [{ typeId: 1, description: 'Server', color: '#cccccc' }],
            placedItems: [{ id: 'a', typeId: 1, x: 1, y: 1, w: 1, h: 1 }], config: { showGrid3d: false } },
        global: { stubs: { Grid: true } },
    })
    await flushPromises()
    const grid = wrapper.findComponent({ name: 'Grid' })
    const originalGrid = grid.vm
    const item = wrapper.vm.getItems()[0]
    wrapper.vm.selectItem(item)
    item.x = 4
    grid.vm.$emit('triggerAction', { x: 8, y: 8 })
    await wrapper.setProps({ config: { showGrid3d: false, handleFill: '#123456' } })
    expect(wrapper.findComponent({ name: 'Grid' }).vm).toBe(originalGrid)
    expect(wrapper.vm.getItems()).toHaveLength(2)
    expect(wrapper.vm.getItems()[0].x).toBe(4)
    const selectedId = wrapper.vm.getActiveItem().id
    await wrapper.setProps({ availableTypes: [{ typeId: 1, description: 'Updated', color: '#abcdef' }] })
    expect(wrapper.vm.getItems()).toHaveLength(2)
    expect(wrapper.vm.getItems()[0]).toMatchObject({ x: 4, description: 'Updated', color: '#abcdef' })
    expect(wrapper.vm.getActiveItem()).toBe(wrapper.vm.getItems().find(item => item.id === selectedId))
    grid.vm.$emit('triggerAction', { x: 10, y: 10 })
    expect(wrapper.vm.getItems().at(-1).color).toBe('#abcdef')
    await wrapper.setProps({ placedItems: [] })
    expect(wrapper.vm.getActiveItem()).toEqual({})
    wrapper.unmount()
})
