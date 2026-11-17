<script setup>
import { ref } from 'vue';
import { GridPlan } from 'grid-plan';
import PreviewToolbar from './PreviewToolbar.vue';
import TypePalette from './TypePalette.vue';
import { libraryIcons } from '../data/items';
const props = defineProps({
  config: { type: Object, required: true }, items: { type: Array, required: true },
  types: { type: Array, required: true }, activeType: [String, Number], view: String, outsideCount: Number,
});
const readonly = defineModel('readonly', { type: Boolean });
const showLabels = defineModel('showLabels', { type: Boolean });
const showCustomTooltip = defineModel('showCustomTooltip', { type: Boolean });
const useIconLibrary = defineModel('useIconLibrary', { type: Boolean });
const emit = defineEmits(['view', 'loadSample', 'clearItems', 'chooseType', 'change', 'created', 'delete', 'select', 'unselect', 'selectType']);
const plan = ref(null);
function initializeType() { plan.value?.setActiveType(props.types.find(type => type.typeId === props.activeType)); }
defineExpose({ setActiveType: type => plan.value?.setActiveType(type), unselect: () => plan.value?.unselect() });
</script>
<template>
  <section class="panel preview-panel" aria-label="Live preview">
    <PreviewToolbar :config="config" :item-count="items.length" :view="view"
      v-model:readonly="readonly" v-model:show-labels="showLabels" v-model:show-custom-tooltip="showCustomTooltip" v-model:use-icon-library="useIconLibrary"
      @view="emit('view', $event)" @load-sample="emit('loadSample')" @clear-items="emit('clearItems')" />
    <TypePalette :types="types" :active-type="activeType" @select="emit('chooseType', $event)" />
    <p class="interaction-hint">
      Click an empty cell to place · Drag to move · Select a corner to
      resize · Drag empty 3D space to orbit
    </p>
    <p v-if="outsideCount" class="notice">
      {{ outsideCount }} item(s) extend beyond this grid. Load the sample
      to fit the current dimensions.
    </p>
    <div v-if="view === 'none'" class="empty">
      Both layouts are hidden. Choose a view above to bring the blueprint
      back.
    </div>
    <div class="blueprint">
      <GridPlan
        ref="plan"
        :config="config"
        :readonly="readonly"
        :placed-items="items"
        :available-types="types"
        @vue:mounted="initializeType"
        @change="emit('change', $event)"
        @created="emit('created', $event)"
        @delete="emit('delete', $event)"
        @select="emit('select', $event)"
        @unselect="emit('unselect')"
        @select-type="emit('selectType', $event)"
      >
        <template v-if="showCustomTooltip" #tooltip="scope">
          <pre style="margin: 0; padding: 0; background: none; color: inherit; white-space: pre-wrap; overflow-wrap: anywhere; max-height: none; overflow: visible;">{{ JSON.stringify(scope, null, 2) }}</pre>
        </template>
        <template #availableType="{ availableType }"
          ><span class="menu-type"
            ><span
              class="swatch"
              :style="{ background: availableType.color }"
            ></span
            >{{ availableType.description }}</span
          ></template
        >
        <template #inventory="{ item, deleteItem, focusItem, isFocused }">
          <div class="inventory-item" :class="{ focused: isFocused }">
            <span
              class="swatch"
              :style="{ background: item.color }"
            ></span
            ><strong>{{ item.description }}</strong
            ><span
              >{{ item.x }}, {{ item.y }} · {{ item.w }} ×
              {{ item.h }}</span
            ><button @click="focusItem">
              {{ isFocused ? "Unfocus" : "Focus" }}</button
            ><button :disabled="readonly" @click="deleteItem">
              Delete
            </button>
          </div>
        </template>
        <template v-if="useIconLibrary" #componentIcon="{ placedItem, maxSize, iconColor }">
          <i class="bi" :class="libraryIcons[placedItem.typeId] || 'bi-box'"
            aria-hidden="true" :style="{
              fontSize: `${maxSize * 0.7}px`, lineHeight: 1, display: 'block',
              color: placedItem.iconColor || iconColor,
            }" />
        </template>
        <template v-if="showLabels" #componentText="{ placedItem }">{{
          placedItem.description
        }}</template>
      </GridPlan>
    </div>
  </section>
</template>
