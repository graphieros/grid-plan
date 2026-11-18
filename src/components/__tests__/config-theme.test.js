import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { defaultConfig, resolveConfig } from "../../config";
import GridPlan from "../GridPlan.vue";

describe("theme configuration", () => {
  test("preserves the current appearance by default and with dark theme", () => {
    expect(resolveConfig()).toEqual(defaultConfig);
    expect(resolveConfig({ theme: "dark" })).toEqual(defaultConfig);
  });
  test("applies light colors while preserving non-color settings and explicit overrides", () => {
    const light = resolveConfig({
      theme: "light",
      gridFill: "#fedcba",
      handleSize: 0.7,
    });
    expect(light.theme).toBe("light");
    expect(light.gridFill).toBe("#fedcba");
    expect(light.handleSize).toBe(0.7);
    expect(light.tooltipColor).toBe("#1E293B");
    expect(light.tooltipBackgroundColor).toBe("#FFFFFFF2");
    expect(light.gridHeight).toBe(defaultConfig.gridHeight);
    expect(light.showTooltip).toBe(defaultConfig.showTooltip);
    expect(defaultConfig.theme).toBe("dark");
    expect(defaultConfig.tooltipColor).toBe("#FFFFFF");
  });
  test("updates the mounted grid when switching themes without losing items", async () => {
    const wrapper = mount(GridPlan, {
      props: {
        availableTypes: [{ typeId: 1, description: "Server" }],
        placedItems: [{ id: "a", typeId: 1, x: 1, y: 1, w: 1, h: 1 }],
        config: { showGrid3d: false },
      },
      global: { stubs: { Grid: true } },
    });
    const grid = wrapper.findComponent({ name: "Grid" });
    const vm = grid.vm;
    const item = wrapper.vm.getItems()[0];
    item.x = 4;
    wrapper.vm.selectItem(item);
    await wrapper.setProps({ config: { theme: "light", showGrid3d: false } });
    expect(grid.vm).toBe(vm);
    expect(grid.props("config").gridFill).toBe("#F8FAFC");
    expect(wrapper.vm.getActiveItem()).toBe(item);
    expect(wrapper.vm.getItems()[0].x).toBe(4);
    await wrapper.setProps({ config: { theme: "dark", showGrid3d: false } });
    expect(grid.props("config").gridFill).toBe(defaultConfig.gridFill);
    wrapper.unmount();
  });
});
