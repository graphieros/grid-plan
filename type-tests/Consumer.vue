<script setup lang="ts">
import { ref } from "vue";
import {
  GridPlan,
  GridPlanMenu,
  GridPlanInventory,
  useGridPlan,
} from "grid-plan";
import type {
  GridPlanItem,
  GridPlanItemType,
  GridPlanPlacedItem,
} from "grid-plan";
const plan = ref<InstanceType<typeof GridPlan> | null>(null);
const items: GridPlanItem[] = [{ typeId: 1, x: 1, y: 1, w: 1, h: 1 }];
const types: GridPlanItemType[] = [{ typeId: 1, description: "Server" }];
const controller = useGridPlan({ placedItems: items, availableTypes: types });
controller.on("change", changed);
function changed(item: GridPlanPlacedItem) {
  const width: number = item.w;
}
</script>
<template>
  <GridPlanMenu :plan="controller" :accordion="false">
    <template #default="{ availableType, isActive }"
      ><span>{{ availableType.description }} {{ isActive }}</span></template
    >
  </GridPlanMenu>
  <GridPlan :plan="controller" />
  <GridPlanInventory :plan="controller">
    <template
      #default="{
        item,
        displayCoordinates,
        focusItem,
        deleteItem,
        hintItem,
        clearHint,
      }"
    >
      <span @mouseenter="hintItem" @mouseleave="clearHint"
        >{{ item.description }} {{ displayCoordinates.label }}</span
      >
      <button @click="focusItem">Focus</button
      ><button @click="deleteItem">Delete</button>
    </template>
  </GridPlanInventory>
  <GridPlan
    ref="plan"
    :placed-items="items"
    :available-types="types"
    :config="{ showGrid3d: false }"
    @change="changed"
  >
    <template #tooltip="{ item, coordinates, isSelected, view }"
      >{{ item.description }} {{ coordinates }} {{ isSelected }}
      {{ view }}</template
    >
    <template #componentIcon="{ placedItem, maxSize, iconColor }"
      ><span :style="{ color: iconColor, fontSize: `${maxSize}px` }">{{
        placedItem.description
      }}</span></template
    >
    <template #inventory="{ item, deleteItem, focusItem, isFocused }"
      ><button @click="deleteItem">{{ item.description }}</button
      ><button @click="focusItem">{{ isFocused }}</button></template
    >
    <template #deleteIcon="{ item }">{{ item.id }}</template>
  </GridPlan>
</template>
