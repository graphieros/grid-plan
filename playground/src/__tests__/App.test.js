import { describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../App.vue";
import { defaultConfig } from "grid-plan";

vi.mock("grid-plan", async (importOriginal) => ({
  ...(await importOriginal()),
  GridPlan: {
    name: "DemoGrid",
    props: ["plan"],
    emits: ["change", "created", "delete", "select", "unselect", "selectType"],
    methods: { setActiveType() {}, unselect() {} },
    template: "<div />",
  },
}));

describe("configuration playground", () => {
  test("switches theme defaults live and preserves custom colors", async () => {
    const wrapper = mount(App);
    const grid = wrapper.findComponent({ name: "DemoGrid" });
    await wrapper
      .find('input[aria-label="Grid Stroke CSS color"]')
      .setValue("#123456");
    await wrapper.find("#setting-theme").setValue("light");
    expect(grid.props("plan").config).toMatchObject({
      theme: "light",
      gridFill: "#F8FAFC",
      tooltipColor: "#1E293B",
      gridStroke: "#123456",
    });
    await wrapper.find("#setting-theme").setValue("dark");
    expect(grid.props("plan").config).toMatchObject({
      theme: "dark",
      gridFill: defaultConfig.gridFill,
      tooltipColor: defaultConfig.tooltipColor,
      gridStroke: "#123456",
    });
    wrapper.unmount();
  });

  test("enables the optional tooltip and custom content example, then resets both", async () => {
    const wrapper = mount(App);
    const grid = wrapper.findComponent({ name: "DemoGrid" });
    expect(
      wrapper.find("#use-custom-tooltip").attributes("disabled") !== undefined,
    ).toBe(!defaultConfig.showTooltip);
    expect(grid.vm.$slots.tooltip).toBeUndefined();
    await wrapper.find("#setting-showTooltip").setValue(true);
    await wrapper.find("#setting-tooltipPosition").setValue("right");
    await wrapper.find("#setting-tooltipWidth").setValue("360px");
    await wrapper.find("#setting-tooltipPadding").setValue("12px 20px");
    await wrapper
      .find('input[aria-label="Tooltip Background Color CSS color"]')
      .setValue("#11223380");
    await wrapper.find("#use-custom-tooltip").setValue(true);
    expect(grid.props("plan").config).toMatchObject({
      showTooltip: true,
      tooltipPosition: "right",
    });
    expect(grid.props("plan").config).toMatchObject({
      tooltipWidth: "360px",
      tooltipPadding: "12px 20px",
      tooltipBackgroundColor: "#11223380",
    });
    expect(grid.vm.$slots.tooltip).toBeDefined();
    await wrapper.find(".page-header button").trigger("click");
    expect(grid.props("plan").config.showTooltip).toBe(
      defaultConfig.showTooltip,
    );
    expect(grid.vm.$slots.tooltip).toBeUndefined();
    wrapper.unmount();
  });
  test("switches all types to library icons and restores their SVG definitions", async () => {
    const wrapper = mount(App);
    const grid = wrapper.findComponent({ name: "DemoGrid" });
    const geometry = () =>
      grid
        .props("plan")
        .items.map(({ id, x, y, w, h, depth }) => ({ id, x, y, w, h, depth }));
    const items = geometry();
    expect(grid.props("plan").availableTypes.every((type) => type.icon)).toBe(
      true,
    );
    expect(grid.vm.$slots.componentIcon).toBeUndefined();
    await wrapper.find("#use-icon-library").setValue(true);
    expect(
      grid
        .props("plan")
        .availableTypes.every((type) => type.icon === undefined),
    ).toBe(true);
    const item = { typeId: 3, iconColor: "#ffffff" };
    const icon = grid.vm.$slots.componentIcon({
      placedItem: item,
      maxSize: 2,
      iconColor: "#000000",
    })[0];
    expect(icon.type).toBe("i");
    expect(icon.props.class).toContain("bi-hdd-rack");
    expect(geometry()).toEqual(items);
    await wrapper.find("#use-icon-library").setValue(false);
    expect(grid.props("plan").availableTypes.every((type) => type.icon)).toBe(
      true,
    );
    expect(grid.vm.$slots.componentIcon).toBeUndefined();
    wrapper.unmount();
  });
  test("preserves created and edited data across config changes", async () => {
    const wrapper = mount(App);
    const grid = wrapper.findComponent({ name: "DemoGrid" });
    const item = {
      id: "new-server",
      typeId: 3,
      x: 5,
      y: 5,
      w: 2,
      h: 2,
      depth: 2.5,
    };
    grid.vm.$emit("created", item);
    await wrapper.vm.$nextTick();
    grid.vm.$emit("change", { ...item, x: 6, depth: 3 });
    await wrapper.vm.$nextTick();
    await wrapper.find("#setting-gridWidth").setValue("30");
    expect(grid.props("plan").config.gridWidth).toBe(30);
    expect(
      grid.props("plan").items.find((value) => value.id === item.id),
    ).toMatchObject({ x: 6, depth: 3 });
    grid.vm.$emit("delete", item);
    await wrapper.vm.$nextTick();
    expect(grid.props("plan").items.some((value) => value.id === item.id)).toBe(
      false,
    );
    wrapper.unmount();
  });
  test("switches views and restores default config", async () => {
    const wrapper = mount(App);
    const grid = wrapper.findComponent({ name: "DemoGrid" });
    await wrapper.findAll(".segmented button")[2].trigger("click");
    expect(grid.props("plan").config).toMatchObject({
      showGrid2d: false,
      showGrid3d: true,
    });
    await wrapper.find(".preview-tools input").setValue(true);
    expect(grid.props("plan").readonly).toBe(true);
    await wrapper.find(".page-header button").trigger("click");
    expect(grid.props("plan").config).toEqual(defaultConfig);
    expect(grid.props("plan").readonly).toBe(false);
    wrapper.unmount();
  });
});
