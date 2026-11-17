<script setup>
import { computed } from 'vue';
import { defaultConfig } from 'grid-plan';
import { choices, numbers, label } from '../data/settings';
const props = defineProps({ name: { type: String, required: true } });
const value = defineModel({ required: true });
const original = computed(() => defaultConfig[props.name]);
const isColor = computed(() => typeof original.value === 'string' && original.value.startsWith('#'));
function updateNumber(event) {
  const input = Number(event.target.value);
  const { min, max, step } = numbers[props.name];
  if (event.target.value !== '' && Number.isFinite(input)) {
    value.value = Number(Math.min(max, Math.max(min, Math.round(input / step) * step)).toFixed(3));
  }
  event.target.value = value.value;
}
</script>

<template>
  <div class="control-row" :class="{ modified: value !== original }">
    <label :for="`setting-${name}`"><span>{{ label(name) }}</span><code>{{ name }}</code></label>
    <input v-if="typeof original === 'boolean'" :id="`setting-${name}`" v-model="value" type="checkbox" class="toggle" />
    <select v-else-if="choices[name]" :id="`setting-${name}`" v-model="value">
      <option v-for="option in choices[name]" :key="option" :value="option">{{ option }}</option>
    </select>
    <div v-else-if="isColor" class="color-control">
      <input :id="`setting-${name}`" v-model.lazy="value" type="color" /><span>{{ value }}</span>
    </div>
    <input v-else-if="numbers[name]" :id="`setting-${name}`" :value="value" type="number" v-bind="numbers[name]" @change="updateNumber" />
    <input v-else :id="`setting-${name}`" v-model.lazy="value" type="text" />
    <button v-if="value !== original" class="reset-field" :aria-label="`Reset ${label(name)}`" :title="`Default: ${original}`" @click="value = original">↺</button>
  </div>
</template>
