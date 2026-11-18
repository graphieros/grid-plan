import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import GridPlan from "../GridPlan.vue";
import defaults from "../../default_config";

// Browser selection releases the pointer before dispatching click. A plain
// mouseup must not emit change and cause GridPlan to replace the clicked SVG.
describe("2D selection", () => {
  test.each([false, true])(
    "preserves the clicked item until selection (readonly: %s)",
    async (readonly) => {
      const wrapper = mount(GridPlan, {
        slots: {
          deleteIcon:
            '<svg data-custom-delete="true"><title>{{ params.item.id }}</title></svg>',
        },
        props: {
          config: { showTooltip: false, showGrid3d: false },
          availableTypes: [
            { typeId: 1, description: "Server", color: "#3366dd" },
          ],
          placedItems: [{ id: "server", typeId: 1, x: 2, y: 2, w: 2, h: 2 }],
          readonly,
        },
      });
      await wrapper.vm.$nextTick();
      const cell = wrapper.find('rect[x="0"][y="0"][width="1"][height="1"]');
      await cell.trigger("mouseover");
      expect(
        wrapper.findAll(`rect[fill="${defaults.crosshairBackground}"]`).length >
          0,
      ).toBe(!readonly);
      expect(
        wrapper.findAll("text").some((text) => text.text() === "A-1"),
      ).toBe(!readonly);
      expect(wrapper.find('rect[fill="#FFFFFF20"]').exists()).toBe(!readonly);
      await cell.trigger("mouseleave");
      const item = wrapper.find('rect[x="2"][y="2"][width="2"][height="2"]');
      const element = item.element;
      await item.trigger("mouseenter");
      expect(wrapper.find(".grid-plan-item-info").text()).toContain("Server");
      expect(wrapper.find(".grid-plan-item-info").text()).toContain("C-3, D-4");
      expect(wrapper.findAll(".grid-plan-hover-corners > path")).toHaveLength(
        4,
      );
      expect(
        wrapper.find(".grid-plan-hover-corners > g").attributes("stroke"),
      ).toBe(defaults.gridFill);
      expect(
        wrapper.find(".grid-plan-hover-corners").attributes("stroke"),
      ).toBe(defaults.handleFill);
      expect(
        wrapper.find(".grid-plan-hover-corners path").attributes("d"),
      ).toBe("M 1.88 2.13 V 1.88 H 2.13");
      expect(wrapper.emitted("select")).toBeUndefined();
      expect(wrapper.vm.getActiveItem()).toEqual({});
      await item.trigger("mouseleave");
      expect(wrapper.find(".grid-plan-item-info").exists()).toBe(false);
      expect(wrapper.find(".grid-plan-hover-corners").exists()).toBe(false);
      await item.trigger("mousedown");
      await item.trigger("mouseup");
      expect(wrapper.emitted("change")).toBeUndefined();
      expect(wrapper.element.contains(element)).toBe(true);
      await item.trigger("click");
      if (readonly) {
        expect(wrapper.emitted("select")).toBeUndefined();
        expect(wrapper.emitted("unselect")).toBeUndefined();
        expect(wrapper.vm.getActiveItem()).toEqual({});
        await item.trigger("mouseenter");
        expect(wrapper.find(".grid-plan-item-info").text()).toContain("Server");
        await item.trigger("click");
        expect(wrapper.find(".grid-plan-item-info").exists()).toBe(true);
        await item.trigger("mouseleave");
        expect(wrapper.find(".grid-plan-item-info").exists()).toBe(false);
        wrapper.unmount();
        return;
      }
      expect(wrapper.emitted("select")?.[0][0]).toMatchObject({ id: "server" });
      expect(wrapper.vm.getActiveItem().id).toBe("server");
      await wrapper.find('rect[style*="cursor: move"]').trigger("mouseenter");
      expect(wrapper.find(".grid-plan-hover-corners").exists()).toBe(false);
      expect(wrapper.find("[data-custom-delete]").exists()).toBe(!readonly);
      if (!readonly)
        expect(wrapper.find("[data-custom-delete] title").text()).toBe(
          "server",
        );
      await wrapper.setProps({
        config: {
          ...wrapper.props("config"),
          itemNameFontSizeRatio: 0.7,
          itemCoordinatesFontSizeRatio: 0.3,
        },
      });
      const info = wrapper.findAll(".grid-plan-item-info text");
      expect(info[0].attributes("font-size")).toBe("0.7");
      expect(info[1].attributes("font-size")).toBe("0.3");
      expect(Number(info[0].attributes("y"))).toBeCloseTo(5.2);
      expect(Number(info[1].attributes("y"))).toBeCloseTo(5.8);
      await wrapper.setProps({
        config: {
          ...wrapper.props("config"),
          itemNameOffsetY: -0.4,
          itemCoordinatesOffsetY: 0.8,
        },
      });
      const shifted = wrapper.findAll(".grid-plan-item-info text");
      expect(Number(shifted[0].attributes("y"))).toBeCloseTo(4.8);
      expect(Number(shifted[1].attributes("y"))).toBeCloseTo(6.6);

      const active = wrapper.find('rect[x="2"][y="2"][width="2"][height="2"]');
      const svg = wrapper.find("svg").element;
      svg.createSVGPoint = () => ({
        x: 0,
        y: 0,
        matrixTransform() {
          return { x: this.x, y: this.y };
        },
      });
      svg.getScreenCTM = () => ({
        inverse() {
          return {};
        },
      });
      await active.trigger("mousedown", { clientX: 100, clientY: 100 });
      await active.trigger("mouseup", { clientX: 100, clientY: 100 });
      expect(wrapper.emitted("change")).toBeUndefined();
      await active.trigger("click");
      expect(wrapper.emitted("unselect")).toHaveLength(1);
      expect(wrapper.vm.getActiveItem()).toEqual({});
      wrapper.unmount();
    },
  );
});

test("switching to readonly clears selection and retains hover information", async () => {
  const wrapper = mount(GridPlan, {
    props: {
      config: { showTooltip: false, showGrid3d: false },
      availableTypes: [{ typeId: 1, description: "Server" }],
      placedItems: [{ id: "a", typeId: 1, x: 2, y: 2, w: 1, h: 1 }],
    },
  });
  await wrapper.vm.$nextTick();
  wrapper.vm.selectItem(wrapper.vm.getItems()[0]);
  await wrapper.vm.$nextTick();
  expect(wrapper.find(".grid-plan-item-info").exists()).toBe(true);
  await wrapper.setProps({ readonly: true });
  expect(wrapper.vm.getActiveItem()).toEqual({});
  expect(wrapper.find(".grid-plan-item-info").exists()).toBe(false);
  const item = wrapper
    .findAll('rect[x="2"][y="2"][width="1"][height="1"]')
    .at(-1);
  await item.trigger("mouseenter");
  await item.trigger("click");
  expect(wrapper.find(".grid-plan-item-info").text()).toContain("Server");
  expect(wrapper.vm.getActiveItem()).toEqual({});
  await item.trigger("mouseleave");
  expect(wrapper.find(".grid-plan-item-info").exists()).toBe(false);
  wrapper.unmount();
});
