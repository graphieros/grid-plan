<script setup>
defineProps({ config: { type: Object, required: true }, itemCount: Number, view: String });
const readonly = defineModel('readonly', { type: Boolean });
const showLabels = defineModel('showLabels', { type: Boolean });
const showCustomTooltip = defineModel('showCustomTooltip', { type: Boolean });
const useIconLibrary = defineModel('useIconLibrary', { type: Boolean });
const emit = defineEmits(['view', 'loadSample', 'clearItems']);
</script>

<template>
  <div>
    <div class="preview-heading">
      <div>
        <p class="eyebrow">LIVE PREVIEW</p>
        <h2>{{ config.gridWidth }} × {{ config.gridHeight }} <span class="muted">/ {{ itemCount }} items</span></h2>
      </div>
      <div class="segmented" aria-label="Visible layouts">
        <button v-for="mode in ['2d', 'both', '3d']" :key="mode" :aria-pressed="view === mode" @click="emit('view', mode)">
          {{ mode === 'both' ? 'Both' : mode.toUpperCase() + ' only' }}
        </button>
      </div>
    </div>
    <div class="preview-tools">
      <label><input v-model="readonly" type="checkbox" /> Read only</label>
      <label><input v-model="showLabels" type="checkbox" /> 2D text slot</label>
      <label><input id="use-icon-library" v-model="useIconLibrary" type="checkbox" /> Bootstrap Icons</label>
      <label><input id="use-custom-tooltip" v-model="showCustomTooltip" type="checkbox" :disabled="!config.showTooltip" /> Custom tooltip slot</label>
      <div class="spacer"></div>
      <button class="button small" @click="emit('loadSample')">Load sample</button>
      <button class="button small" :disabled="readonly || !itemCount" @click="emit('clearItems')">Clear items</button>
    </div>
  </div>
</template>
