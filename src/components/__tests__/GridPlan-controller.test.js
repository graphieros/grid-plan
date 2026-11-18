import { expect, test, vi } from "vitest";
import { effectScope, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import GridPlan from "../GridPlan.vue";
import GridPlanMenu from "../GridPlanMenu.vue";
import GridPlanInventory from "../GridPlanInventory.vue";
import { useGridPlan } from "../../composables/useGridPlan";

const types = [
  { typeId: 1, description: "Server" },
  { typeId: 2, description: "Switch" },
];
const item = { id: "a", typeId: 1, x: 1, y: 2, w: 1, h: 1 };

test("external controls synchronize selection, hints, creation and deletion with the grid", async () => {
  let plan;
  const selected = vi.fn(),
    deleted = vi.fn();
  const wrapper = mount({
    setup() {
      plan = useGridPlan({
        placedItems: [item],
        availableTypes: types,
        config: { showGrid3d: false, showTooltip: false },
      });
      plan.on("select", selected);
      plan.on("delete", deleted);
      return () =>
        h("div", [
          h("aside", h(GridPlanMenu, { plan, accordion: false })),
          h(GridPlan, { plan }),
          h("footer", h(GridPlanInventory, { plan, accordion: false })),
        ]);
    },
  });
  await wrapper.findAll("aside button")[1].trigger("click");
  expect(plan.activeType.typeId).toBe(2);
  plan.createItem({ x: 4, y: 4 });
  await nextTick();
  expect(plan.items).toHaveLength(2);
  expect(
    wrapper.findAll("footer .grid-plan-inventory__body > div"),
  ).toHaveLength(2);
  expect(plan.items[1].typeId).toBe(2);
  const row = wrapper.find("footer .grid-plan-inventory__body > div");
  await row.trigger("mouseenter");
  expect(plan.hintedItem.id).toBe("a");
  expect(wrapper.find(".grid-plan-hover-corners").exists()).toBe(true);
  await row.trigger("mouseleave");
  expect(plan.hintedItem).toBeNull();
  await row.find("button").trigger("click");
  expect(plan.activeEntity.id).toBe("a");
  expect(selected).toHaveBeenCalledTimes(2);
  expect(wrapper.find(".grid-plan-delete-control").exists()).toBe(true);
  await row.findAll("button")[1].trigger("click");
  expect(plan.items).toHaveLength(1);
  expect(plan.activeEntity).toEqual({});
  expect(deleted).toHaveBeenCalledTimes(1);
  wrapper.unmount();
});

test("readonly actions are guarded and independent controllers do not share state", async () => {
  let first, second;
  const readonly = ref(false);
  const wrapper = mount({
    setup() {
      first = useGridPlan({
        placedItems: [item],
        availableTypes: types,
        readonly,
      });
      second = useGridPlan({ placedItems: [item], availableTypes: types });
      return () => h(GridPlanInventory, { plan: first });
    },
  });
  first.selectItem(first.items[0]);
  expect(second.activeEntity).toEqual({});
  readonly.value = true;
  await nextTick();
  expect(first.activeEntity).toEqual({});
  first.deleteItem(first.items[0]);
  first.focusItem(first.items[0]);
  first.createItem({ x: 4, y: 4 });
  first.setActiveType(types[1]);
  expect(first.items).toHaveLength(1);
  expect(first.activeEntity).toEqual({});
  expect(first.activeType.typeId).toBe(1);
  expect(
    wrapper
      .findAll("button")
      .every((button) => button.attributes("disabled") !== undefined),
  ).toBe(true);
  first.hintItem(first.items[0]);
  expect(first.hintedItem.id).toBe("a");
  second.deleteItem(second.items[0]);
  expect(first.items).toHaveLength(1);
  expect(second.items).toHaveLength(0);
  wrapper.unmount();
});

test("slot adapters use standalone components only when their slots are supplied", () => {
  const wrapper = mount(GridPlan, {
    props: {
      placedItems: [item],
      availableTypes: types,
      config: { showGrid2d: false, showGrid3d: false },
    },
  });
  expect(wrapper.findComponent(GridPlanMenu).exists()).toBe(false);
  expect(wrapper.findComponent(GridPlanInventory).exists()).toBe(false);
  wrapper.unmount();
  const adapted = mount(GridPlan, {
    props: {
      placedItems: [item],
      availableTypes: types,
      config: { showGrid2d: false, showGrid3d: false },
    },
    slots: {
      availableType: ({ availableType }) =>
        h("span", availableType.description),
      inventory: ({ displayCoordinates }) =>
        h("span", displayCoordinates.label),
    },
  });
  expect(adapted.findComponent(GridPlanMenu).exists()).toBe(true);
  expect(adapted.findComponent(GridPlanInventory).exists()).toBe(true);
  expect(adapted.text()).toContain("B-3");
  adapted.unmount();
});

test("generated IDs remain stable and event forwarding cleans up when grids unmount", async () => {
  let plan;
  const source = ref([{ typeId: 1, x: 0, y: 0, w: 1, h: 1 }]);
  const visible = ref(true);
  const selected = vi.fn();
  const wrapper = mount({
    setup() {
      plan = useGridPlan({
        placedItems: source,
        availableTypes: types,
        config: { showGrid2d: false, showGrid3d: false },
      });
      return () =>
        visible.value ? h(GridPlan, { plan, onSelect: selected }) : h("span");
    },
  });
  const id = plan.items[0].id;
  source.value[0].x = 3;
  await nextTick();
  expect(plan.items[0].id).toBe(id);
  plan.selectItem(plan.items[0]);
  expect(selected).toHaveBeenCalledTimes(1);
  visible.value = false;
  await nextTick();
  plan.selectItem(plan.items[0]);
  expect(selected).toHaveBeenCalledTimes(1);
  visible.value = true;
  await nextTick();
  plan.selectItem(plan.items[0]);
  expect(selected).toHaveBeenCalledTimes(2);
  const events = vi.fn();
  const stop = plan.on("select", events);
  stop();
  plan.selectItem(plan.items[0]);
  expect(events).not.toHaveBeenCalled();
  wrapper.unmount();
});

test("creation rejects invalid placements without changing items, selection, or emitting events", () => {
  const scope = effectScope();
  try {
    const plan = scope.run(() =>
      useGridPlan({
        placedItems: [{ ...item, x: 0, y: 0 }],
        availableTypes: types,
        config: { gridWidth: 2, gridHeight: 2 },
      }),
    );
    const created = vi.fn(),
      selected = vi.fn();
    plan.selectItem(plan.items[0]);
    const active = plan.activeEntity;
    plan.on("created", created);
    plan.on("select", selected);
    for (const point of [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 0.5, y: 1 },
      { x: 1, y: 0.5 },
      { x: NaN, y: 0 },
      { x: 0, y: Infinity },
    ])
      plan.createItem(point);
    expect(plan.items).toHaveLength(1);
    expect(plan.activeEntity).toBe(active);
    expect(created).not.toHaveBeenCalled();
    expect(selected).not.toHaveBeenCalled();
    plan.createItem({ x: 1, y: 1 });
    expect(plan.items).toHaveLength(2);
    expect(created).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledTimes(1);
    expect(plan.activeEntity).toMatchObject({ x: 1, y: 1, w: 1, h: 1 });
  } finally {
    scope.stop();
  }
});

test.each([false, true])(
  "custom menu buttons select once without nesting buttons (legacy: %s)",
  async (legacy) => {
    const scope = effectScope();
    const plan = scope.run(() =>
      useGridPlan({
        availableTypes: types,
        config: { showGrid2d: false, showGrid3d: false },
      }),
    );
    const selected = vi.fn();
    plan.on("selectType", selected);
    const render = ({ availableType, selectType }) =>
      h(
        "button",
        {
          type: "button",
          onClick: selectType,
        },
        availableType.description,
      );
    const wrapper = mount(legacy ? GridPlan : GridPlanMenu, {
      props: { plan },
      slots: legacy ? { availableType: render } : { default: render },
    });
    try {
      expect(wrapper.find("button button").exists()).toBe(false);
      await wrapper.findAll("button")[1].trigger("click");
      expect(plan.activeType.typeId).toBe(2);
      expect(selected).toHaveBeenCalledTimes(1);
    } finally {
      wrapper.unmount();
      scope.stop();
    }
  },
);
