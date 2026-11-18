<script setup lang="ts">
import type {
  GridPlanResolvedConfig,
  GridPlanPlacedItem,
  GridPlanItemType,
} from "grid-plan";
import type { ViewMode } from "../types";
import { onMounted } from "vue";
import {
  GridPlan,
  GridPlanMenu,
  GridPlanInventory,
  useGridPlan,
} from "grid-plan";
import PreviewToolbar from "./PreviewToolbar.vue";
import TypePalette from "./TypePalette.vue";
import { libraryIcons } from "../data/items";
const props = defineProps<{
  config: GridPlanResolvedConfig;
  items: GridPlanPlacedItem[];
  types: GridPlanItemType[];
  activeType: string | number;
  view: ViewMode;
  outsideCount: number;
}>();
const readonly = defineModel<boolean>("readonly", { default: false });
const showLabels = defineModel<boolean>("showLabels", { default: false });
const showCustomTooltip = defineModel<boolean>("showCustomTooltip", {
  default: false,
});
const useIconLibrary = defineModel<boolean>("useIconLibrary", {
  default: false,
});
const emit = defineEmits<{
  view: [mode: Exclude<ViewMode, "none">];
  loadSample: [];
  clearItems: [];
  chooseType: [type: GridPlanItemType];
  change: [item: GridPlanPlacedItem];
  created: [item: GridPlanPlacedItem];
  delete: [item: GridPlanPlacedItem];
  select: [item: GridPlanPlacedItem];
  unselect: [];
  selectType: [type: GridPlanItemType];
}>();
const plan = useGridPlan({
  placedItems: () => props.items,
  availableTypes: () => props.types,
  config: () => props.config,
  readonly,
});
function initializeType() {
  const type = props.types.find((type) => type.typeId === props.activeType);
  if (type) plan.setActiveType(type);
}
onMounted(initializeType);
defineExpose({
  setActiveType: (type: GridPlanItemType) => plan.setActiveType(type),
  unselect: () => plan.unselect(),
});
</script>
<template>
  <section class="panel preview-panel" aria-label="Live preview">
    <PreviewToolbar
      :config="config"
      :item-count="items.length"
      :view="view"
      v-model:readonly="readonly"
      v-model:show-labels="showLabels"
      v-model:show-custom-tooltip="showCustomTooltip"
      v-model:use-icon-library="useIconLibrary"
      @view="emit('view', $event)"
      @load-sample="emit('loadSample')"
      @clear-items="emit('clearItems')"
    />
    <TypePalette
      :types="types"
      :active-type="activeType"
      @select="emit('chooseType', $event)"
    />
    <p class="interaction-hint">
      Click an empty cell to place · Drag to move · Select a corner to resize ·
      Drag empty 3D space to orbit
    </p>
    <p v-if="outsideCount" class="notice">
      {{ outsideCount }} item(s) extend beyond this grid. Load the sample to fit
      the current dimensions.
    </p>
    <div v-if="view === 'none'" class="empty">
      Both layouts are hidden. Choose a view above to bring the blueprint back.
    </div>
    <GridPlanMenu :plan="plan">
      <template #default="{ availableType, isActive, selectType }">
        <button
          type="button"
          :disabled="readonly"
          :aria-pressed="isActive"
          @click="selectType"
        >
          <span class="menu-type"
            ><span
              class="swatch"
              :style="{ background: availableType.color }"
            ></span
            >{{ availableType.description }}</span
          >
        </button>
      </template>
    </GridPlanMenu>
    <GridPlanInventory :plan="plan">
      <template
        #default="{
          item,
          displayCoordinates,
          deleteItem,
          focusItem,
          isFocused,
        }"
      >
        <div class="inventory-item" :class="{ focused: isFocused }">
          <span class="swatch" :style="{ background: item.color }"></span
          ><strong>{{ item.description }}</strong
          ><span
            >{{ displayCoordinates.label }} · {{ item.w }} × {{ item.h }}</span
          ><button @click="focusItem">
            {{ isFocused ? "Unfocus" : "Focus" }}</button
          ><button :disabled="readonly" @click="deleteItem">Delete</button>
        </div>
      </template>
    </GridPlanInventory>
    <div class="blueprint">
      <GridPlan
        :plan="plan"
        @change="emit('change', $event)"
        @created="emit('created', $event)"
        @delete="emit('delete', $event)"
        @select="emit('select', $event)"
        @unselect="emit('unselect')"
        @select-type="emit('selectType', $event)"
      >
        <template v-if="showCustomTooltip" #tooltip="scope">
          <pre
            style="
              margin: 0;
              padding: 0;
              background: none;
              color: inherit;
              white-space: pre-wrap;
              overflow-wrap: anywhere;
              max-height: none;
              overflow: visible;
            "
            >{{ JSON.stringify(scope, null, 2) }}</pre>
        </template>
        <template
          v-if="useIconLibrary"
          #componentIcon="{ placedItem, maxSize, iconColor }"
        >
          <i
            class="bi"
            :class="libraryIcons[placedItem.typeId] || 'bi-box'"
            aria-hidden="true"
            :style="{
              fontSize: `${maxSize * 0.7}px`,
              lineHeight: 1,
              display: 'block',
              color: placedItem.iconColor || iconColor,
            }"
          />
        </template>
        <template v-if="showLabels" #componentText="{ placedItem }">{{
          placedItem.description
        }}</template>
      </GridPlan>
    </div>
  </section>
</template>
