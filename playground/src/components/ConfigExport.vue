<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { GridPlanResolvedConfig } from "grid-plan";
const props = defineProps<{ config: GridPlanResolvedConfig }>();
const json = computed(() => JSON.stringify(props.config, null, 2));
const status = ref("");
watch(json, () => {
  status.value = "";
});
async function copy() {
  try {
    await navigator.clipboard.writeText(json.value);
    status.value = "Config copied";
  } catch {
    status.value = "Select and copy the JSON below.";
  }
}
</script>
<template>
  <details class="panel config-export">
    <summary>
      Configuration JSON <span class="muted">Copy into your component</span>
    </summary>
    <div class="export-actions">
      <button class="button small" @click="copy">Copy config</button
      ><span role="status">{{ status }}</span>
    </div>
    <textarea
      :value="json"
      readonly
      aria-label="Configuration JSON"
      spellcheck="false"
    ></textarea>
  </details>
</template>
