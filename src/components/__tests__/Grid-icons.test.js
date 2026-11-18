import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import GridPlan from "../GridPlan.vue";
import { resolveGridIcon } from "../../lib/grid-icon";

const path = "M2 2H22V22H2Z";

describe("item icons", () => {
  test("keeps library icons at a fixed size in 1x1 and larger items", async () => {
    const item = { id: "font-icon", typeId: 1, x: 2, y: 3, w: 1, h: 1 };
    const wrapper = mount(GridPlan, {
      props: {
        config: { showTooltip: false, showGrid3d: false },
        availableTypes: [{ typeId: 1, description: "Font icon" }],
        placedItems: [item],
      },
      slots: {
        componentIcon: ({ maxSize }) =>
          h("i", {
            "data-size": maxSize,
            style: { fontSize: `${maxSize * 0.7}px` },
          }),
      },
    });
    await wrapper.vm.$nextTick();
    const check = () => {
      const target = wrapper.find(".grid-plan-component-icon");
      expect(target.attributes()).toMatchObject({ width: "1", height: "1" });
      expect(target.find("i").attributes("data-size")).toBe("32");
      expect(target.find("i").element.style.fontSize).toBe("22.4px");
      expect(target.attributes("viewBox")).toBe("0 0 32 32");
      expect(target.find("foreignObject").attributes()).toMatchObject({
        x: "0",
        y: "0",
        width: "32",
        height: "32",
      });
    };
    check();
    for (const [w, h] of [
      [1, 2],
      [2, 1],
      [2, 2],
      [4, 4],
    ]) {
      await wrapper.setProps({ placedItems: [{ ...item, w, h }] });
      check();
      const target = wrapper.find(".grid-plan-component-icon");
      expect(Number(target.attributes("x")) + 0.5).toBe(item.x + w / 2);
      expect(Number(target.attributes("y")) + 0.5).toBe(item.y + h / 2);
    }
    wrapper.unmount();
  });
  test.each([
    ["server", "0 0 24 24", "none"],
    [path, "0 0 24 24", "none"],
    [[path, "M8 8L16 16"], "0 0 24 24", "none"],
    [
      {
        paths: "M0 0H32V32H0Z",
        viewBox: "0 0 32 32",
        fill: "currentColor",
        stroke: "none",
      },
      "0 0 32 32",
      "currentColor",
    ],
  ])(
    "renders availableTypes icon %j before and after selection",
    async (icon, viewBox, fill) => {
      const wrapper = mount(GridPlan, {
        props: {
          config: { showTooltip: false, showGrid3d: false },
          availableTypes: [
            { typeId: 1, description: "Custom", icon, iconColor: "#ff0000" },
          ],
          placedItems: [{ id: "custom", typeId: 1, x: 2, y: 3, w: 2, h: 2 }],
        },
      });
      await wrapper.vm.$nextTick();
      const check = () => {
        const icons = wrapper.findAll("svg.grid-plan-component-icon");
        expect(icons).toHaveLength(1);
        expect(icons[0].attributes("viewBox")).toBe(viewBox);
        expect(icons[0].attributes("style")).toContain("color: rgb(255, 0, 0)");
        expect(icons[0].find("path").attributes("fill")).toBe(fill);
        if (typeof icon === "string" && icon !== "server")
          expect(icons[0].find("path").attributes("d")).toBe(path);
      };
      check();
      wrapper.vm.selectItem(wrapper.vm.getItems()[0]);
      await wrapper.vm.$nextTick();
      check();
      await wrapper.setProps({
        config: { ...wrapper.props("config"), showIcons: false },
      });
      expect(wrapper.findAll("svg.grid-plan-component-icon")).toHaveLength(0);
      await wrapper.setProps({
        config: { ...wrapper.props("config"), showIcons: true },
      });
      check();
      wrapper.unmount();
    },
  );

  test("ignores unknown names and malformed icon definitions", () => {
    for (const icon of [
      "unknown-name",
      '<svg onload="bad()" />',
      {},
      { paths: [null, 5] },
      42,
    ]) {
      expect(resolveGridIcon(icon)).toBeNull();
    }
  });
});
