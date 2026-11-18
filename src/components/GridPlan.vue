<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from "vue";
import Grid from "./Grid.vue";
import GridPlanMenu from "./GridPlanMenu.vue";
import GridPlanInventory from "./GridPlanInventory.vue";
import { useGridPlan } from "../composables/useGridPlan";
import type {
  GridPlanProps,
  GridPlanEvents,
  GridPlanSlots,
  GridPlanExpose,
} from "../types";
const props = defineProps<GridPlanProps>();
defineSlots<GridPlanSlots>();
const emit = defineEmits<GridPlanEvents>();
const local = useGridPlan({
  placedItems: () => props.placedItems ?? [],
  availableTypes: () => props.availableTypes ?? [],
  config: () => props.config ?? {},
  readonly: () => props.readonly ?? false,
});
const plan = computed(() => props.plan ?? local);
const layoutScope = computed(() => ({
  items: plan.value.items,
  activeEntity: plan.value.activeEntity,
  deleteItem: plan.value.deleteItem,
  focusItem: plan.value.focusItem,
  hintItem: plan.value.hintItem,
  getFocusState: plan.value.getFocusState,
  displayCoordinates: plan.value.displayCoordinates,
}));
const Grid3d = defineAsyncComponent(() => import("./Grid3d.vue"));
watch(
  plan,
  (current, _, cleanup) => {
    const stops = [
      current.on("change", (item) => emit("change", item)),
      current.on("created", (item) => emit("created", item)),
      current.on("delete", (item) => emit("delete", item)),
      current.on("select", (item) => emit("select", item)),
      current.on("selectType", (type) => emit("selectType", type)),
      current.on("unselect", () => emit("unselect")),
    ];
    cleanup(() => stops.forEach((stop) => stop()));
  },
  { immediate: true },
);
defineExpose({
  deleteItem: (item) => plan.value.deleteItem(item),
  focusItem: (item) => plan.value.focusItem(item),
  hintItem: (item) => plan.value.hintItem(item),
  getItems: () => plan.value.getItems(),
  getActiveItem: () => plan.value.getActiveItem(),
  getFocusState: (item) => plan.value.getFocusState(item),
  selectItem: (item) => plan.value.selectItem(item),
  setActiveType: (type) => plan.value.setActiveType(type),
  unselect: () => plan.value.unselect(),
} satisfies GridPlanExpose);
</script>

<template>
  <main class="grid-plan-main" style="position: relative">
    <slot name="before" v-bind="layoutScope" />
    <GridPlanMenu v-if="$slots.availableType" :plan="plan">
      <template #default="scope"
        ><slot name="availableType" v-bind="scope"
      /></template>
    </GridPlanMenu>
    <GridPlanInventory v-if="$slots.inventory" :plan="plan">
      <template #default="scope"
        ><slot name="inventory" v-bind="scope"
      /></template>
    </GridPlanInventory>
    <template
      v-for="view in plan.config.grid3dPosition === 'top'
        ? ['3d', '2d']
        : ['2d', '3d']"
      :key="view"
    >
      <component
        :is="view === '3d' ? Grid3d : Grid"
        v-if="view === '3d' ? plan.config.showGrid3d : plan.config.showGrid2d"
        :items="plan.items"
        :active-entity="plan.activeEntity"
        :hinted-item="plan.hintedItem"
        :config="plan.config"
        :readonly="plan.readonly"
        @select-item="plan.selectItem"
        @change="plan.recordChange"
        @trigger-action="plan.createItem"
        @delete="plan.deleteItem"
        @unselect="plan.unselect"
      >
        <template v-if="$slots.tooltip" #tooltip="scope"
          ><slot name="tooltip" v-bind="scope"
        /></template>
        <template v-if="$slots.componentIcon" #componentIcon="scope"
          ><slot name="componentIcon" v-bind="scope"
        /></template>
        <template v-if="$slots.deleteIcon" #deleteIcon="scope"
          ><slot name="deleteIcon" v-bind="scope"
        /></template>
        <template v-if="$slots.componentText" #componentText="scope"
          ><slot name="componentText" v-bind="scope"
        /></template>
      </component>
    </template>
    <slot name="after" v-bind="layoutScope" />
  </main>
</template>
