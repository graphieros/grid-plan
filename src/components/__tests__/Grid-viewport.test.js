import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import Grid from "../Grid.vue";
import originalDefaults from "../../default_config";
const defaults = { ...originalDefaults, showTooltip: false };

describe("2D controls at grid edges", () => {
  test.each([
    [0, 0],
    [19, 0],
    [0, 19],
    [19, 19],
  ])("keeps buttons and labels inside the viewport at %s, %s", async (x, y) => {
    const item = {
      id: "edge",
      x,
      y,
      w: 1,
      h: 1,
      description: "An item with a long description",
    };
    const wrapper = mount(Grid, {
      props: {
        items: [item],
        activeEntity: item,
        config: {
          ...defaults,
          itemNameFontSizeRatio: 1.2,
          itemCoordinatesFontSizeRatio: 0.8,
        },
      },
    });
    await wrapper.vm.$nextTick();
    const [left, top, width, height] = wrapper
      .find("svg")
      .attributes("viewBox")
      .split(" ")
      .map(Number);
    const button = wrapper.find(".grid-plan-delete-button");
    const [buttonX, buttonY] = wrapper
      .find(".grid-plan-delete-control")
      .attributes("transform")
      .match(/-?[\d.]+/g)
      .map(Number);
    expect(button.attributes("width")).toBe("0.65");
    expect(button.attributes("height")).toBe("0.65");
    if (x === 0 && y === 0) {
      const press = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      button.element.dispatchEvent(press);
      expect(press.defaultPrevented).toBe(true);
      expect(wrapper.emitted("delete")).toBeUndefined();
      expect(button.element.style.outlineWidth).toBe("0px");
      await button.trigger("focus");
      expect(button.attributes("stroke-width")).toBe("0.07");
      await button.trigger("blur");
      expect(button.attributes("stroke-width")).toBe("0.025");
    }

    expect(buttonX).toBeGreaterThanOrEqual(left);
    expect(buttonY).toBeGreaterThanOrEqual(top);
    expect(buttonX + 0.65).toBeLessThanOrEqual(left + width);
    expect(buttonY + 0.65).toBeLessThanOrEqual(top + height);
    expect(
      wrapper.find(".grid-plan-delete-control").attributes("data-position"),
    ).toBe(x === 0 ? "right" : "left");
    const labels = wrapper.findAll(".grid-plan-item-info text");
    for (const label of labels) {
      const baseline = Number(label.attributes("y"));
      const font = Number(label.attributes("font-size"));
      expect(baseline + font * 0.3).toBeLessThan(top + height);
      expect(
        Number(label.attributes("x")) - (item.description.length * 1.2) / 2,
      ).toBeGreaterThan(left);
      expect(
        Number(label.attributes("x")) + (item.description.length * 1.2) / 2,
      ).toBeLessThan(left + width);
    }
    if (y === 19)
      expect(Number(labels[0].attributes("y")) - 1.2).toBeGreaterThan(21);
    const previous = wrapper.find("svg").attributes("viewBox");
    await wrapper.find('rect[style*="cursor: move"]').trigger("mouseenter");
    expect(wrapper.find("svg").attributes("viewBox")).toBe(previous);
    expect(left + width).toBeGreaterThan(20);
    wrapper.unmount();
  });
});
