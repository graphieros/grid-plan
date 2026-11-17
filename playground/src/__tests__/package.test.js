import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';
import { GridPlan, defaultConfig } from 'grid-plan';
import { groups } from '../data/settings';

// Exercise the actual package exports, rather than the source component or the
// App test's stub, so missing/stale dist exports fail the playground checks.
describe('local package integration', () => {
  test('renders the built package and exposes working selection controls', async () => {
    const wrapper = mount(GridPlan, {
      props: {
        availableTypes: [{ typeId: 1, description: 'Built package', icon: 'server' }],
        placedItems: [{ id: 'built', typeId: 1, x: 1, y: 1, w: 1, h: 1 }],
        config: { showTooltip: false, showGrid3d: false, showInventory: false, showMenu: false },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.grid-plan-grid').exists()).toBe(true);
    expect(wrapper.vm.getItems()[0].description).toBe('Built package');
    wrapper.vm.selectItem(wrapper.vm.getItems()[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.grid-plan-item-info').text()).toContain('Built package');
    wrapper.unmount();
  });
  test('has a control for every option exported by the current build', () => {
    const controls = groups.flatMap(group => group.keys);
    expect([...controls].sort()).toEqual(Object.keys(defaultConfig).sort());
    expect(new Set(controls).size).toBe(controls.length);
  });
});
