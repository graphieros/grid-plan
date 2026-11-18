import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import GridPlan from "../GridPlan.vue";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe("2D keyboard item navigation", () => {
  test.each([false, true])(
    "cycles focus and separates selection from focus (readonly: %s)",
    async (readonly) => {
      const wrapper = mount(GridPlan, {
        props: {
          readonly,
          config: { showGrid3d: false, showTooltip: true },
          availableTypes: [{ typeId: 1, description: "Server" }],
          placedItems: [
            { id: "a", typeId: 1, x: 1, y: 1, w: 1, h: 1 },
            { id: "b", typeId: 1, x: 4, y: 4, w: 1, h: 1 },
          ],
        },
        slots: {
          tooltip: ({ item, isSelected }) =>
            h(
              "span",
              {
                class: "keyboard-tooltip",
                "data-selected": String(isSelected),
              },
              item.id,
            ),
        },
      });
      await wrapper.vm.$nextTick();
      const grid = wrapper.find(".grid-plan-grid");
      expect(grid.attributes("tabindex")).toBe("0");
      await grid.trigger("keydown", { key: "ArrowRight" });
      expect(wrapper.find(".keyboard-tooltip").text()).toBe("a");
      expect(
        wrapper.find(".keyboard-tooltip").attributes("data-selected"),
      ).toBe("false");
      expect(wrapper.vm.getActiveItem()).toEqual({});
      await grid.trigger("keydown", { key: "ArrowDown" });
      expect(wrapper.find(".keyboard-tooltip").text()).toBe("b");
      await grid.trigger("keydown", { key: "ArrowRight" });
      expect(wrapper.find(".keyboard-tooltip").text()).toBe("a");
      await grid.trigger("keydown", { key: "ArrowUp" });
      expect(wrapper.find(".keyboard-tooltip").text()).toBe("b");
      await grid.trigger("keydown", { key: "Enter" });
      expect(wrapper.vm.getActiveItem()).toMatchObject(
        readonly ? {} : { id: "b" },
      );
      expect(
        wrapper.find(".keyboard-tooltip").attributes("data-selected"),
      ).toBe(String(!readonly));
      await grid.trigger("keydown", { key: "Escape" });
      expect(wrapper.vm.getActiveItem()).toEqual({});
      expect(wrapper.find(".keyboard-tooltip").exists()).toBe(readonly);
      if (readonly) {
        expect(wrapper.emitted("select")).toBeUndefined();
        expect(wrapper.emitted("unselect")).toBeUndefined();
      }
      await grid.trigger("blur");
      expect(wrapper.find(".keyboard-tooltip").exists()).toBe(false);
      await wrapper.setProps({ placedItems: [] });
      await grid.trigger("keydown", { key: "ArrowLeft" });
      expect(wrapper.find(".grid-plan-keyboard-focus").exists()).toBe(false);
      wrapper.unmount();
    },
  );
  test("keyboard shortcuts are scoped to their grid", async () => {
    const props = {
      availableTypes: [{ typeId: 1, description: "Server" }],
      placedItems: [{ id: "a", typeId: 1, x: 1, y: 1, w: 1, h: 1 }],
      config: { showGrid3d: false },
    };
    const first = mount(GridPlan, { props });
    const second = mount(GridPlan, { props });
    await first.vm.$nextTick();
    await first
      .find(".grid-plan-grid")
      .trigger("keydown", { key: "ArrowLeft" });
    expect(first.find(".grid-plan-keyboard-focus").exists()).toBe(true);
    expect(second.find(".grid-plan-keyboard-focus").exists()).toBe(false);
    await first.find(".grid-plan-grid").trigger("keydown", { key: "Enter" });
    expect(first.vm.getActiveItem().id).toBe("a");
    expect(second.vm.getActiveItem()).toEqual({});
    first.unmount();
    second.unmount();
  });
});
