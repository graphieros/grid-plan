<script setup>
import { computed, ref, watch } from 'vue';
const props = defineProps({ config: { type: Object, required: true } });
const json = computed(() => JSON.stringify(props.config, null, 2));
const status = ref('');
watch(json, () => { status.value = ''; });
async function copy() {
  try { await navigator.clipboard.writeText(json.value); status.value = 'Config copied'; }
  catch { status.value = 'Select and copy the JSON below.'; }
}
</script>
<template>
  <details class="panel config-export">
    <summary>Configuration JSON <span class="muted">Copy into your component</span></summary>
    <div class="export-actions"><button class="button small" @click="copy">Copy config</button><span role="status">{{ status }}</span></div>
    <textarea :value="json" readonly aria-label="Configuration JSON" spellcheck="false"></textarea>
  </details>
</template>
