<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, toRefs, watch } from "vue"
import Grid from "./Grid.vue";
import { createUid } from "../lib";
import { resolveConfig } from "../config";
import type { GridPlanProps, GridPlanEvents, GridPlanSlots, GridPlanPlacedItem, GridPlanSelection, GridPlanItemType, GridPlanPoint, GridPlanItem, GridPlanExpose } from "../types";

const Grid3d = defineAsyncComponent(() => import("./Grid3d.vue"));

const props = withDefaults(defineProps<GridPlanProps>(), {
  placedItems: () => [], availableTypes: () => [], config: () => ({}), readonly: false,
});
defineSlots<GridPlanSlots>();

onMounted(() => {
  if(!props.availableTypes || !props.availableTypes.length) {
    console.warn(`
    Grid plan: you must provide props.availableTypes

    Example:

    [
      {
        description: "server",
        color: "#CCCCCC",
        typeId: 1
      },
      {
        description: "monitor",
        color: "#6376DD",
        typeId: 2
      }
    ]
    `)
  }
})

const emit = defineEmits<GridPlanEvents>();

const items = ref<GridPlanPlacedItem[]>([]);

const { placedItems, availableTypes } = toRefs(props)

const generatedIds = new WeakMap<GridPlanItem, string | number>();
let previousTypes = new Map(props.availableTypes.map(type => [type.typeId, { ...type }]));
function syncSelection() {
  const id = entity.value.id;
  if (id !== undefined) entity.value = items.value.find(item => item.id === id) ?? {};
}
function prepareItems() {
  items.value = props.placedItems.map(item => {
    const details = props.availableTypes.find(type => type.typeId === item.typeId);
    const id = item.id ?? generatedIds.get(item) ?? createUid();
    generatedIds.set(item, id);
    return { ...item, id, ...details } as GridPlanPlacedItem;
  });
  syncSelection();
}
onMounted(prepareItems);
watch(placedItems, prepareItems, { deep: true });
watch(availableTypes, () => {
  // A type edit refreshes existing records without reverting geometry or dropping
  // items created through the editor. Removed type fields fall back to item props.
  items.value = items.value.map(item => {
    const original = props.placedItems.find(source => (source.id ?? generatedIds.get(source)) === item.id);
    const previous = previousTypes.get(item.typeId);
    const details = props.availableTypes.find(type => type.typeId === item.typeId);
    const base: GridPlanItem = { ...item };
    for (const key of Object.keys(previous ?? {})) {
      if (['id', 'typeId', 'x', 'y', 'w', 'h'].includes(key)) continue;
      if (original && Object.hasOwn(original, key)) base[key] = original[key];
      else delete base[key];
    }
    const keepDepth = item.depth !== undefined && (original?.depth !== undefined || item.depth !== previous?.depth);
    return { ...base, ...details, id: item.id, x: item.x, y: item.y, w: item.w, h: item.h,
      ...(keepDepth ? { depth: item.depth } : {}) } as GridPlanPlacedItem;
  });
  syncSelection();
  activeType.value = props.availableTypes.find(type => type.typeId === activeType.value?.typeId) ?? props.availableTypes[0];
  previousTypes = new Map(props.availableTypes.map(type => [type.typeId, { ...type }]));
}, { deep: true });

const finalConfig = computed(() => resolveConfig(props.config));

function recordChange(entity: GridPlanPlacedItem) {

  emit('change', entity)
}

const entity = ref<GridPlanSelection>({})
watch(() => props.readonly, readonly => {
  if (readonly) entity.value = {};
});


function selectItem(item: GridPlanPlacedItem) {
  if (props.readonly) return;
  emit('select', item);
  entity.value = item;

}

function triggerAction(rect: GridPlanPoint) {
  const item = { ...rect, h: 1, w: 1, id: createUid(), ...activeType.value } as GridPlanPlacedItem;
  items.value.push(item);
  emit('created', item);
  selectItem(item);
}

const activeType = ref<GridPlanItemType | undefined>(availableTypes.value[0])

function setActiveType(t: GridPlanItemType) {
  activeType.value = t;
  emit('selectType', t)
}

function deleteItem(item: GridPlanPlacedItem) {
  emit('delete', item);
  items.value = items.value.filter(i => i.id !== item.id)
  entity.value = {}

}

function unselect() {
  if (props.readonly) return;
  emit('unselect');
  entity.value = {}

}

function getItems(): GridPlanPlacedItem[] {
  return items.value;
}

function focusItem(item: GridPlanPlacedItem) {
  if (props.readonly) return;
  if(entity.value.id === item.id) {
    entity.value = {}

  } else {
    entity.value = {}

    entity.value = item
  }
}

function getFocusState(item: GridPlanItem) {
  return item && item.id === entity.value.id
}

function getActiveItem(): GridPlanSelection { return entity.value; }

defineExpose({
  deleteItem,
  focusItem,
  getActiveItem,
  getFocusState,
  getItems,
  selectItem,
  setActiveType,
  unselect,
} satisfies GridPlanExpose)

</script>

<template>
  <main class="grid-plan-main" :style="{ position: 'relative' }">
    <slot name="before" v-bind="{ items, deleteItem, focusItem, getFocusState, activeEntity: entity }"/>

    <Grid3d
      v-if="finalConfig.grid3dPosition === 'top' && finalConfig.showGrid3d"
      :items="items" 
      :active-entity="entity"
      :config="finalConfig"
      :readonly="readonly"
      @selectItem="selectItem"
      @change="recordChange"
      @triggerAction="triggerAction"
      @delete="deleteItem"
      @unselect="unselect"
    >
      <template v-if="$slots.tooltip" #tooltip="slotProps">
        <slot name="tooltip" v-bind="slotProps" />
      </template>
      <template v-if="$slots.componentIcon" #componentIcon="slotProps">
        <slot name="componentIcon" v-bind="slotProps" />
      </template>
      <template v-if="$slots.deleteIcon" #deleteIcon="slotProps">
        <slot name="deleteIcon" v-bind="slotProps" />
      </template>
    </Grid3d>

    <template v-if="finalConfig.showMenu">
      <details v-if="finalConfig.useAccordionMenu" class="grid-plan-menu">
        <summary class="grid-plan-menu__summary">
          {{ finalConfig.accordionMenuTitle }}
        </summary>
        <div class="grid-plan-menu__body">
          <div v-for="t in availableTypes" @click="setActiveType(t)">
            <slot name="availableType" v-bind="{ availableType: t }"/>
          </div>
        </div>
      </details>
  
      <div v-else class="grid-plan-menu">
        <div v-for="t in availableTypes" @click="setActiveType(t)">
          <slot name="availableType" v-bind="{ availableType: t }"/>
        </div>
      </div>
    </template>

    <details v-if="finalConfig.showInventory && items.length" class="grid-plan-inventory">
        <summary class="grid-plan-inventory__summary">
          {{ finalConfig.inventoryTitle }}
        </summary>
        <div class="grid-plan-inventory__body">
          <div v-for="item in items">
            <slot name="inventory" v-bind="{ item, deleteItem: () => deleteItem(item), focusItem: () => focusItem(item), isFocused: entity && entity.id === item.id }"/>
          </div>
        </div>
    </details>

    <Grid
      v-if="finalConfig.showGrid2d"
      :readonly="readonly"
      :items="items" 
      :active-entity="entity"
      :config="finalConfig"
      @change="recordChange" 
      @selectItem="selectItem"
      @triggerAction="triggerAction"
      @delete="deleteItem"
      @unselect="unselect"
    >

    <template v-if="$slots.tooltip" #tooltip="slotProps">
      <slot name="tooltip" v-bind="slotProps" />
    </template>
    <template v-if="$slots.deleteIcon" #deleteIcon="slotProps">
      <slot name="deleteIcon" v-bind="slotProps" />
    </template>

    <template v-if="$slots.componentIcon" #componentIcon="slotProps">
      <slot name="componentIcon" v-bind="slotProps" />
    </template>

    <template #componentText="scope">
      <slot name="componentText" v-bind="scope"/>
    </template>
  </Grid>

  <Grid3d
    v-if="finalConfig.grid3dPosition === 'bottom' && finalConfig.showGrid3d"
    :items="items" 
    
    :active-entity="entity"
    :config="finalConfig"
    :readonly="readonly"
    @selectItem="selectItem"
    @change="recordChange"
    @triggerAction="triggerAction"
    @delete="deleteItem"
    @unselect="unselect"
  >
    <template v-if="$slots.componentIcon" #componentIcon="slotProps">
      <slot name="componentIcon" v-bind="slotProps" />
    </template>
    <template v-if="$slots.tooltip" #tooltip="slotProps">
      <slot name="tooltip" v-bind="slotProps" />
    </template>
    <template v-if="$slots.deleteIcon" #deleteIcon="slotProps">
      <slot name="deleteIcon" v-bind="slotProps" />
    </template>
  </Grid3d>
  <slot name="after" v-bind="{ items, deleteItem, focusItem, getFocusState, activeEntity: entity }"/>
  </main>
</template>
