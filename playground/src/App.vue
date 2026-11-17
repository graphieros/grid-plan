<script setup lang="ts">
import ConfigPanel from "./components/ConfigPanel.vue";
import PlanPreview from "./components/PlanPreview.vue";
import SelectionInspector from "./components/SelectionInspector.vue";
import EventLog from "./components/EventLog.vue";
import ConfigExport from "./components/ConfigExport.vue";
import { usePlayground } from "./composables/usePlayground";

const {
  config,
  readonly,
  showLabels,
  showCustomTooltip,
  useIconLibrary,
  plan,
  activeType,
  selected,
  events,
  items,
  types,
  changedCount,
  outsideCount,
  view,
  saveItem,
  removeItem,
  selectItem,
  unselect,
  chooseType,
  selectType,
  setView,
  resetItems,
  resetConfig,
} = usePlayground();
</script>

<template>
  <div class="playground">
    <header class="page-header">
      <div>
        <h1>Grid Plan</h1>
        <p class="subtitle">Dev playground</p>
      </div>
      <button class="button" @click="resetConfig">
        Reset config <span v-if="changedCount">({{ changedCount }})</span>
      </button>
    </header>
    <div class="workspace">
      <ConfigPanel v-model="config" />
      <main class="preview-column">
        <PlanPreview
          ref="plan"
          :config="config"
          :items="items"
          :types="types"
          :active-type="activeType"
          :view="view"
          :outside-count="outsideCount"
          v-model:readonly="readonly"
          v-model:show-labels="showLabels"
          v-model:show-custom-tooltip="showCustomTooltip"
          v-model:use-icon-library="useIconLibrary"
          @view="setView"
          @load-sample="resetItems()"
          @clear-items="resetItems(true)"
          @choose-type="chooseType"
          @change="saveItem('change', $event)"
          @created="saveItem('created', $event)"
          @delete="removeItem"
          @select="selectItem"
          @unselect="unselect"
          @select-type="selectType"
        />
        <div class="inspectors">
          <SelectionInspector :selected="selected" />
          <EventLog :events="events" @clear="events = []" />
        </div>
        <ConfigExport :config="config" />
      </main>
    </div>
  </div>
</template>
