import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import GridPlan from "../GridPlan.vue";

test.each([false, true])(
  "hints an item without selection and clears stale hints (readonly: %s)",
  async (readonly) => {
    const item = { id: "a", typeId: 1, x: 1, y: 1, w: 1, h: 1 };
    const wrapper = mount(GridPlan, {
      props: {
        readonly,
        availableTypes: [{ typeId: 1, description: "Server" }],
        placedItems: [item],
        config: { showGrid3d: false, showTooltip: false },
      },
    });
    await wrapper.vm.$nextTick();
    wrapper.vm.hintItem(wrapper.vm.getItems()[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".grid-plan-hover-corners").exists()).toBe(true);
    expect(wrapper.find(".grid-plan-item-info").text()).toContain("Server");
    expect(wrapper.vm.getActiveItem()).toEqual({});
    expect(wrapper.emitted("select")).toBeUndefined();
    expect(wrapper.emitted("change")).toBeUndefined();
    wrapper.vm.hintItem(null);
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".grid-plan-hover-corners").exists()).toBe(false);
    wrapper.vm.hintItem(item);
    await wrapper.vm.$nextTick();
    await wrapper.setProps({ placedItems: [] });
    expect(wrapper.find(".grid-plan-hover-corners").exists()).toBe(false);
    wrapper.unmount();
  },
);
