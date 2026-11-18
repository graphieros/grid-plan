import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import { formatCoordinate, parseCoordinate } from "../../index";
import GridPlan from "../GridPlan.vue";

test.each([
  [0, "A"],
  [25, "Z"],
  [26, "AA"],
  [51, "AZ"],
  [52, "BA"],
  [701, "ZZ"],
  [702, "AAA"],
  [Number.MAX_SAFE_INTEGER - 1, "BKTXHSOGHKKE"],
])("round-trips coordinate %s", (index, alpha) => {
  expect(formatCoordinate(index, "alphabetic")).toBe(alpha);
  expect(parseCoordinate(alpha.toLowerCase(), "alphabetic")).toBe(index);
  expect(parseCoordinate(formatCoordinate(index, "numeric"), "numeric")).toBe(
    index,
  );
});

test("rejects invalid positions and labels instead of silently coercing them", () => {
  for (const index of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    expect(() => formatCoordinate(index, "numeric")).toThrow();
  }
  for (const label of ["", "0", "-1", "1.5", "1e2", "01", "9007199254740992"]) {
    expect(() => parseCoordinate(label, "numeric")).toThrow();
  }
  for (const label of ["", "A1", "A-B", "AAAAAAAAAAAAAA"]) {
    expect(() => parseCoordinate(label, "alphabetic")).toThrow();
  }
});

test("inventory and before/after slots expose reactive labels without modifying item data", async () => {
  const item = { id: "a", typeId: 1, x: 1, y: 2, w: 2, h: 1 };
  let inventory, before, after;
  const wrapper = mount(GridPlan, {
    props: {
      availableTypes: [{ typeId: 1, description: "Server" }],
      placedItems: [item],
      config: { showGrid2d: false, showGrid3d: false },
    },
    slots: {
      inventory: (scope) => {
        inventory = scope;
        return h("span", scope.displayCoordinates.label);
      },
      before: (scope) => {
        before = scope;
        return null;
      },
      after: (scope) => {
        after = scope;
        return null;
      },
    },
  });
  await wrapper.vm.$nextTick();
  expect(inventory.displayCoordinates).toEqual({
    x: "B",
    y: "3",
    label: "B-3, C-3",
  });
  expect(before.displayCoordinates(inventory.item)).toEqual(
    inventory.displayCoordinates,
  );
  expect(after.displayCoordinates(inventory.item)).toEqual(
    inventory.displayCoordinates,
  );
  await wrapper.setProps({
    config: {
      showGrid2d: false,
      showGrid3d: false,
      abscissaType: "numeric",
      ordinatesType: "alphabetic",
    },
  });
  expect(inventory.displayCoordinates).toEqual({
    x: "2",
    y: "C",
    label: "2-C, 3-C",
  });
  expect(inventory.item).toMatchObject(item);
  expect(wrapper.vm.getItems()[0]).toMatchObject(item);
  expect(wrapper.emitted("change")).toBeUndefined();
  expect(item).toEqual({ id: "a", typeId: 1, x: 1, y: 2, w: 2, h: 1 });
  wrapper.unmount();
});
