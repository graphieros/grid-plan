import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { h } from 'vue';
import { mount } from '@vue/test-utils';
import GridPlan from '../GridPlan.vue';
import ItemTooltip from '../ItemTooltip.vue';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());

describe('optional item tooltip', () => {
  test('applies all configured styles to custom content and supports CSS lengths', async () => {
    const wrapper = mount(ItemTooltip, { props: {
      item: { description: 'Server' }, getAnchor: () => null,
      config: {
        tooltipColor: '#aabbcc', tooltipBackgroundColor: '#112233', tooltipBorderRadius: 12,
        tooltipLineHeight: 2, tooltipPadding: '6px 10px', tooltipBorder: '2px solid red',
        tooltipBoxShadow: 'none', tooltipWidth: 320, tooltipMaxWidth: 360, tooltipMaxHeight: 220,
      },
    }, slots: { default: '<span>Custom content</span>' } });
    const style = wrapper.element.style;
    expect(style.color).toBe('rgb(170, 187, 204)');
    expect(style.backgroundColor).toBe('rgb(17, 34, 51)');
    expect(style.borderRadius).toBe('12px');
    expect(style.lineHeight).toBe('2');
    expect(style.padding).toBe('6px 10px');
    expect(style.border).toBe('2px solid red');
    expect(style.boxShadow).toBe('none');
    expect(style.width).toBe('320px');
    expect(style.maxWidth).toBe('360px');
    expect(style.maxHeight).toBe('220px');
    await wrapper.setProps({ config: { tooltipWidth: '20rem', tooltipMaxWidth: '90%',
      tooltipMaxHeight: '50vh', tooltipBorderRadius: '1rem', tooltipPadding: 4, tooltipLineHeight: '24px' } });
    expect(style.width).toBe('20rem');
    expect(style.maxWidth).toBe('90%');
    expect(style.maxHeight).toBe('50vh');
    expect(style.borderRadius).toBe('1rem');
    expect(style.padding).toBe('4px');
    expect(style.lineHeight).toBe('24px');
    wrapper.unmount();
  });

  test('repositions when configured width changes instead of assuming a fixed width', async () => {
    const container = document.createElement('div');
    container.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 400 });
    const wrapper = mount(ItemTooltip, { props: {
      item: { description: 'Server' }, container,
      getAnchor: () => ({ left: 250, right: 350, top: 150, bottom: 180 }),
      config: { tooltipWidth: 160, tooltipMaxWidth: 420 },
    } });
    Object.defineProperty(wrapper.element, 'offsetWidth', { get() { return parseFloat(this.style.width); } });
    Object.defineProperty(wrapper.element, 'offsetHeight', { value: 60 });
    await wrapper.setProps({ coordinates: 'A-1' });
    expect(wrapper.element.style.left).toBe('220px');
    await wrapper.setProps({ config: { tooltipWidth: 400, tooltipMaxWidth: 420 } });
    expect(wrapper.element.style.left).toBe('100px');
    expect(wrapper.attributes('data-side')).toBe('top');
    expect(wrapper.attributes('data-position')).toBe('top');
    wrapper.unmount();
  });
  test('forwards the full item on readonly hover and allows selection only when editable', async () => {
    const render = ({ item, isSelected, coordinates, view }) => h('div', {
      class: 'custom-tooltip', 'data-selected': String(isSelected), 'data-view': view,
    }, `${item.description} ${coordinates} ${item.metadata.serial}`);
    const wrapper = mount(GridPlan, {
      props: {
        readonly: true, config: { showGrid3d: false, showMenu: false, showInventory: false },
        availableTypes: [{ typeId: 1, description: 'Server' }],
        placedItems: [{ id: 'a', typeId: 1, x: 2, y: 2, w: 2, h: 1, metadata: { serial: 'ABC' } }],
      }, slots: { tooltip: render },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.grid-plan-tooltip').exists()).toBe(false);
    await wrapper.setProps({ config: { ...wrapper.props('config'), showTooltip: true, tooltipPadding: 20, tooltipWidth: 180 } });
    const item = wrapper.find('rect[x="2"][y="2"][width="2"][height="1"]');
    await item.trigger('mouseenter');
    expect(wrapper.find('.custom-tooltip').text()).toBe('Server C-3, D-3 ABC');
    expect(wrapper.find('.grid-plan-tooltip').element.style.padding).toBe('20px');
    expect(wrapper.find('.grid-plan-tooltip').element.style.width).toBe('180px');
    expect(wrapper.find('.custom-tooltip').attributes()).toMatchObject({ 'data-selected': 'false', 'data-view': '2d' });
    expect(wrapper.find('.grid-plan-item-info').exists()).toBe(false);
    expect(wrapper.emitted('select')).toBeUndefined();
    await item.trigger('mouseleave');
    expect(wrapper.find('.grid-plan-tooltip').exists()).toBe(false);
    wrapper.vm.selectItem(wrapper.vm.getItems()[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.custom-tooltip').exists()).toBe(false);
    expect(wrapper.vm.getActiveItem()).toEqual({});
    await wrapper.setProps({ readonly: false });
    wrapper.vm.selectItem(wrapper.vm.getItems()[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.custom-tooltip').attributes('data-selected')).toBe('true');
    await wrapper.setProps({ config: { ...wrapper.props('config'), showTooltip: false } });
    expect(wrapper.find('.grid-plan-tooltip').exists()).toBe(false);
    expect(wrapper.find('.grid-plan-item-info').exists()).toBe(true);
    wrapper.unmount();
  });

  test('positions relative to its own boundary and updates after a resize', async () => {
    const container = document.createElement('div');
    container.getBoundingClientRect = () => ({ left: 100, top: 50, width: 400, height: 300 });
    const wrapper = mount(ItemTooltip, { props: {
      item: { description: 'Server', w: 1, h: 1 }, coordinates: 'A-1', container,
      getAnchor: () => ({ left: 250, right: 350, top: 60, bottom: 100 }),
    } });
    Object.defineProperty(wrapper.element, 'offsetWidth', { value: 100 });
    Object.defineProperty(wrapper.element, 'offsetHeight', { value: 50 });
    await wrapper.setProps({ preferred: 'bottom' });
    expect(wrapper.attributes('data-side')).toBe('bottom');
    expect(wrapper.attributes('data-position')).toBe('bottom');
    expect(wrapper.element.style.left).toBe('150px');
    expect(wrapper.element.style.top).toBe('60px');
    expect(wrapper.attributes('role')).toBe('tooltip');
    await wrapper.setProps({ getAnchor: () => ({ left: 250, right: 350, top: 290, bottom: 330 }), preferred: 'bottom' });
    expect(wrapper.attributes('data-side')).toBe('top');
    expect(wrapper.attributes('data-position')).toBe('top');
    expect(wrapper.element.style.top).toBe('180px');
    wrapper.unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
