<script setup lang="ts">
import { ref } from 'vue';
import { GridPlan } from 'grid-plan';
import type { GridPlanItem, GridPlanItemType, GridPlanPlacedItem } from 'grid-plan';
const plan = ref<InstanceType<typeof GridPlan> | null>(null);
const items: GridPlanItem[] = [{ typeId: 1, x: 1, y: 1, w: 1, h: 1 }];
const types: GridPlanItemType[] = [{ typeId: 1, description: 'Server' }];
function changed(item: GridPlanPlacedItem) { const width: number = item.w; }
</script>
<template>
  <GridPlan ref="plan" :placed-items="items" :available-types="types" :config="{ showGrid3d: false }" @change="changed">
    <template #tooltip="{ item, coordinates, isSelected, view }">{{ item.description }} {{ coordinates }} {{ isSelected }} {{ view }}</template>
    <template #componentIcon="{ placedItem, maxSize, iconColor }"><span :style="{ color: iconColor, fontSize: `${maxSize}px` }">{{ placedItem.description }}</span></template>
    <template #inventory="{ item, deleteItem, focusItem, isFocused }"><button @click="deleteItem">{{ item.description }}</button><button @click="focusItem">{{ isFocused }}</button></template>
    <template #deleteIcon="{ item }">{{ item.id }}</template>
  </GridPlan>
</template>
