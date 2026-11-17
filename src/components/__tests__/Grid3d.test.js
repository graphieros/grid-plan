import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { PerspectiveCamera, Vector3, TextureLoader, Texture } from 'three'
import Grid3d from '../Grid3d.vue'
import config from '../../default_config.json'

const { renderScene } = vi.hoisted(() => ({ renderScene: vi.fn() }))

vi.mock('three', async importOriginal => {
    const actual = await importOriginal()
    return { ...actual, WebGLRenderer: class {
        constructor({ canvas }) { this.domElement = canvas; this.shadowMap = {} }
        setSize() {} setPixelRatio() {} render(scene, camera) { scene.updateMatrixWorld(); camera.updateMatrixWorld(); renderScene(scene) } dispose() {}
    } }
})

let wrapper
let camera
beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(480)
    camera = new PerspectiveCamera(75, 800 / 480, 0.1, 1000)
    camera.position.set(0, 20, 12)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function setup(readonly = false, slots = {}, itemOverrides = {}) {
    const item = { id: 'a', x: 9, y: 9, w: 2, h: 2, color: '#ff0000', ...itemOverrides }
    wrapper = mount(Grid3d, { slots, props: { items: [item], activeEntity: item, config: { ...config, showBox: false }, readonly } })
    const canvas = wrapper.find('canvas').element
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 480 })
    canvas.setPointerCapture = vi.fn()
    canvas.hasPointerCapture = () => true
    canvas.releasePointerCapture = vi.fn()
    return item
}

async function pointer(type, x, y, z) {
    const point = new Vector3(x, y, z).project(camera)
    await wrapper.find('canvas').trigger(type, { button: 0, pointerId: 1,
        clientX: (point.x + 1) * 400, clientY: (1 - point.y) * 240 })
}

describe('3D editor interactions', () => {
    test('renders the tooltip slot for a hovered item and falls back to the selected item', async () => {
        const item = setup(true, { tooltip: ({ item, isSelected, coordinates, view }) => h('div', {
            class: 'test-tooltip', 'data-selected': String(isSelected), 'data-view': view,
        }, `${item.description} ${coordinates} ${item.metadata.serial}`) },
        { description: 'Server', metadata: { serial: 'ABC' } })
        expect(wrapper.find('.grid-plan-tooltip').exists()).toBe(false)
        await wrapper.setProps({ config: { ...config, showBox: false, showTooltip: true,
            tooltipBackgroundColor: '#123456', tooltipWidth: 220 }, activeEntity: {} })
        await pointer('pointermove', 0, 1, 0)
        expect(wrapper.find('.test-tooltip').text()).toBe('Server J-10, K-11 ABC')
        expect(wrapper.find('.grid-plan-tooltip').element.style.backgroundColor).toBe('rgb(18, 52, 86)')
        expect(wrapper.find('.grid-plan-tooltip').element.style.width).toBe('220px')
        expect(wrapper.find('.test-tooltip').attributes()).toMatchObject({ 'data-selected': 'false', 'data-view': '3d' })
        expect(wrapper.emitted('selectItem')).toBeUndefined()
        await wrapper.find('canvas').trigger('pointerleave')
        expect(wrapper.find('.grid-plan-tooltip').exists()).toBe(false)
        await wrapper.setProps({ activeEntity: item })
        expect(wrapper.find('.test-tooltip').attributes('data-selected')).toBe('true')
        const scene = renderScene.mock.calls.at(-1)[0]
        expect(scene.children.filter(child => child.element?.classList.contains('grid-plan-grid-3d-hover-info'))).toHaveLength(0)
    })
    test.each([false, true])('highlights the hovered floor cell and coordinates (readonly: %s)', async readonly => {
        setup(readonly)
        const scene = renderScene.mock.calls.at(-1)[0]
        const cell = () => scene.children.find(child => child.name === 'grid-plan-grid-3d-cell-hover')
        await pointer('pointermove', -5.5, -0.01, 0.5)
        if (readonly) {
            expect(cell()).toBeUndefined()
            expect(wrapper.emitted('hoverSquare')).toBeUndefined()
            return
        }
        expect(cell().userData.cell).toEqual({ x: 4, y: 10 })
        expect(cell().position.x).toBe(-5.5)
        expect(cell().position.z).toBe(0.5)
        const label = cell().children.find(child => child.isCSS2DObject)
        expect(label.element.textContent).toBe('E-11')
        expect(label.element.style.pointerEvents).toBe('none')
        expect(cell().children.filter(child => child.isMesh)).toHaveLength(readonly ? 1 : 3)
        const previous = cell()
        await pointer('pointermove', -5.5, -0.01, 0.5)
        expect(cell()).toBe(previous)
        expect(wrapper.emitted('selectItem')).toBeUndefined()
        expect(wrapper.emitted('unselect')).toBeUndefined()
        await pointer('pointermove', 0, 1, 0)
        expect(cell()).toBeUndefined()
        await pointer('pointermove', -5.5, -0.01, 0.5)
        expect(cell()).toBeDefined()
        await wrapper.find('canvas').trigger('pointerleave')
        expect(cell()).toBeUndefined()
    })

    test('honors coordinate styles and showCrosshair, and hides the cell while orbiting', async () => {
        setup()
        await wrapper.setProps({ config: { ...config, showBox: false, showCrosshair: false,
            abscissaType: 'numeric', ordinatesType: 'alphabetic' } })
        const scene = renderScene.mock.calls.at(-1)[0]
        const cell = () => scene.children.find(child => child.name === 'grid-plan-grid-3d-cell-hover')
        await pointer('pointermove', -5.5, -0.01, 0.5)
        expect(cell().children.find(child => child.isCSS2DObject).element.textContent).toBe('5-K')
        expect(cell().children.filter(child => child.isMesh)).toHaveLength(1)
        const dispose = vi.spyOn(cell().children[0].geometry, 'dispose')
        await pointer('pointerdown', -5.5, -0.01, 0.5)
        expect(cell()).toBeUndefined()
        expect(dispose).toHaveBeenCalledOnce()
        await pointer('pointermove', -4.5, -0.01, 0.5)
        expect(cell()).toBeUndefined()
        await pointer('pointerup', -4.5, -0.01, 0.5)
        expect(wrapper.emitted('triggerAction')).toBeUndefined()
    })
    test.each(['i', 'span'])('supports a %s icon slot, follows edits, and respects showIcons', async tag => {
        const renderIcon = vi.fn(({ placedItem, maxSize, iconColor }) => h(tag, {
            class: 'custom-library-icon', 'data-item': placedItem.id,
            'data-size': maxSize, 'data-color': iconColor,
        }))
        const item = setup(false, { componentIcon: renderIcon })
        await wrapper.vm.$nextTick()
        const overlay = () => renderScene.mock.calls.at(-1)[0].children.find(child => child.element?.classList.contains('grid-plan-grid-3d-component-icon'))
        expect(overlay().element.querySelector(tag)?.getAttribute('data-item')).toBe(item.id)
        expect(overlay().element.querySelector(tag)?.getAttribute('data-size')).toBe('32')
        expect(overlay().element.style.pointerEvents).toBe('none')
        expect(overlay().isCSS3DObject).toBe(true)
        expect(overlay().rotation.x).toBeCloseTo(-Math.PI / 2)
        expect(overlay().scale.x).toBeCloseTo(1 / 32)
        const updated = { ...item, x: 11, w: 3, depth: 2 }
        await wrapper.setProps({ items: [updated], activeEntity: updated })
        expect(overlay().position.x).toBeCloseTo(2.5)
        expect(overlay().position.y).toBeCloseTo(2.02)
        expect(renderIcon.mock.calls.at(-1)[0].placedItem).toMatchObject(updated)
        await wrapper.setProps({ config: { ...config, showBox: false, showIcons: false } })
        expect(overlay()).toBeUndefined()
        await wrapper.setProps({ config: { ...config, showBox: false, showIcons: true } })
        expect(overlay().element.querySelector(tag)).not.toBeNull()
    })
    test.each([false, true])('shows hover information without selecting an item (readonly: %s)', async readonly => {
        setup(readonly, {}, { description: 'Server' })
        await wrapper.setProps({ activeEntity: {} })
        await pointer('pointermove', 0, 1, 0)
        const hoverLabels = () => renderScene.mock.calls.at(-1)[0].children.filter(child => child.element?.classList.contains('grid-plan-grid-3d-hover-info'))
        expect(hoverLabels()).toHaveLength(1)
        expect(hoverLabels()[0].element.textContent).toBe('Server (J-10, K-11)')
        expect(wrapper.emitted('selectItem')).toBeUndefined()
        expect(wrapper.emitted('unselect')).toBeUndefined()
        await pointer('pointermove', 0, 1, 0)
        expect(hoverLabels()).toHaveLength(1)
        await wrapper.find('canvas').trigger('pointerleave')
        expect(hoverLabels()).toHaveLength(0)
    })
    test('toggles 3D item icons with showIcons without hiding delete controls', async () => {
        const load = vi.spyOn(TextureLoader.prototype, 'load').mockReturnValue(new Texture())
        setup(false, {}, { icon: 'server' })
        const icons = () => renderScene.mock.calls.at(-1)[0].children.filter(child => child.material?.isMeshBasicMaterial)
        expect(icons()).toHaveLength(1)
        await wrapper.setProps({ config: { ...config, showBox: false, showIcons: false } })
        expect(icons()).toHaveLength(0)
        expect(wrapper.find('.grid-plan-grid-3d-delete').exists()).toBe(true)
        await wrapper.setProps({ config: { ...config, showBox: false, showIcons: true } })
        expect(icons()).toHaveLength(1)
        expect(load).toHaveBeenCalledTimes(1)
    })
    test.each([
        'server',
        'M2 2H22V22H2Z',
        ['M2 2H22V22H2Z', 'M6 6L18 18'],
        { paths: ['M4 4H28V28H4Z'], viewBox: '0 0 32 32', fill: 'currentColor', stroke: 'none' },
    ].map(icon => [icon]))('renders icon %j on the top face and reuses its texture during edits', async icon => {
        const texture = new Texture()
        const dispose = vi.spyOn(texture, 'dispose')
        const load = vi.spyOn(TextureLoader.prototype, 'load').mockReturnValue(texture)
        const item = setup(false, {}, { icon, iconColor: '#123456' })
        const svg = new DOMParser().parseFromString(decodeURIComponent(load.mock.calls[0][0].split(',')[1]), 'image/svg+xml')
        expect(svg.documentElement.getAttribute('color')).toBe('#123456')
        expect(svg.querySelectorAll('path').length).toBeGreaterThan(0)
        if (typeof icon === 'object' && !Array.isArray(icon)) {
            expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 32 32')
            expect(svg.querySelector('path').getAttribute('fill')).toBe('currentColor')
        }
        const scene = renderScene.mock.calls.at(-1)[0]
        const iconMesh = () => scene.children.find(child => child.material?.isMeshBasicMaterial)
        expect(iconMesh().position.y).toBeCloseTo(1.01)
        expect(iconMesh().material.map).toBe(texture)
        const updated = { ...item, x: 11, w: 3, depth: 2 }
        await wrapper.setProps({ items: [updated], activeEntity: updated })
        expect(iconMesh().position.x).toBeCloseTo(2.5)
        expect(iconMesh().position.y).toBeCloseTo(2.01)
        expect(load).toHaveBeenCalledTimes(1)
        wrapper.unmount()
        wrapper = null
        expect(dispose).toHaveBeenCalledOnce()
    })
    test('renders a custom delete icon and keeps it working when the selected item updates', async () => {
        const renderIcon = vi.fn(({ item }) => h('svg', { 'data-item': item.id }))
        const item = setup(false, { deleteIcon: renderIcon })
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.grid-plan-grid-3d-delete svg').attributes('data-item')).toBe('a')
        expect(wrapper.find('.grid-plan-grid-3d-delete path').exists()).toBe(false)
        const updated = { ...item, id: 'b', x: 12 }
        await wrapper.setProps({ items: [updated], activeEntity: updated })
        await wrapper.vm.$nextTick()
        expect(renderIcon.mock.calls.at(-1)[0].item.id).toBe('b')
        await wrapper.setProps({ readonly: true })
        expect(wrapper.find('.grid-plan-grid-3d-delete').exists()).toBe(false)
    })
    test('provides a floating delete button for the selected item and removes it on deselection', async () => {
        const item = setup()
        const button = wrapper.find('.grid-plan-grid-3d-delete')
        expect(button.attributes('aria-label')).toBe('Delete item')
        await button.trigger('pointerdown')
        await button.trigger('click')
        expect(wrapper.emitted('delete')?.[0]).toEqual([item])
        expect(wrapper.emitted('unselect')).toBeUndefined()
        await wrapper.setProps({ activeEntity: {} })
        expect(wrapper.find('.grid-plan-grid-3d-delete').exists()).toBe(false)
    })

    test('hides the floating delete button in readonly mode', () => {
        setup(true)
        expect(wrapper.find('.grid-plan-grid-3d-delete').exists()).toBe(false)
    })
    test.each([false, true])('clicking an active item clears selection (readonly: %s)', async readonly => {
        setup(readonly)
        await pointer('pointerdown', 0, 1, 0)
        await pointer('pointerup', 0, 1, 0)
        expect(wrapper.emitted('unselect')).toHaveLength(1)
        expect(wrapper.emitted('change')).toBeUndefined()
    })
    test('moves items with pointer capture and emits a single committed change', async () => {
        const item = setup()
        await pointer('pointerdown', 0, 1, 0)
        await pointer('pointermove', 2, 1, 0)
        await pointer('pointerup', 2, 1, 0)
        expect(item.x).toBe(11)
        expect(wrapper.emitted('change')).toHaveLength(1)
        expect(wrapper.emitted('unselect')).toBeUndefined()
    })
    test('resizes from a corner handle', async () => {
        const item = setup()
        await pointer('pointerdown', 1, 1, 1)
        await pointer('pointermove', 3, 1, 3)
        await pointer('pointerup', 3, 1, 3)
        expect(item.w).toBe(4)
        expect(item.h).toBe(4)
        expect(wrapper.emitted('change')).toHaveLength(1)
    })
    test('continues resizing from bottom-left across the top and right edges', async () => {
        const item = setup()
        await pointer('pointerdown', -1, 1, 1)
        await pointer('pointermove', 3, 1, -3)
        await pointer('pointerup', 3, 1, -3)
        expect(item).toMatchObject({ x: 11, y: 7, w: 2, h: 2 })
        expect(wrapper.emitted('change')).toHaveLength(1)
        expect(wrapper.emitted('unselect')).toBeUndefined()
    })
    test('cancels an edit and restores the initial dimensions', async () => {
        const item = setup()
        await pointer('pointerdown', 0, 1, 0)
        await pointer('pointermove', 2, 1, 0)
        await wrapper.find('canvas').trigger('pointercancel', { pointerId: 1 })
        expect(item.x).toBe(9)
        expect(wrapper.emitted('change')).toBeUndefined()
    })
    test('creates an item by clicking an empty floor cell', async () => {
        setup()
        await pointer('pointerdown', -5.5, -0.01, 0.5)
        await pointer('pointerup', -5.5, -0.01, 0.5)
        expect(wrapper.emitted('triggerAction')?.[0]).toEqual([{ x: 4, y: 10 }])
    })
    test('supports depth changes and deletion', async () => {
        const item = setup()
        await wrapper.find('input').setValue('2.5')
        expect(item.depth).toBe(2.5)
        expect(wrapper.emitted('change')).toHaveLength(1)
        await wrapper.find('button').trigger('click')
        expect(wrapper.emitted('delete')?.[0]).toEqual([item])
    })
    test('readonly disables edits and creation while allowing selection', async () => {
        const item = setup(true)
        await pointer('pointerdown', 0, 1, 0)
        await pointer('pointermove', 2, 1, 0)
        await pointer('pointerup', 2, 1, 0)
        expect(item.x).toBe(9)
        expect(wrapper.find('input').exists()).toBe(false)
        await pointer('pointerdown', -5.5, -0.01, 0.5)
        await pointer('pointerup', -5.5, -0.01, 0.5)
        expect(wrapper.emitted('change')).toBeUndefined()
        expect(wrapper.emitted('triggerAction')).toBeUndefined()
    })
})
