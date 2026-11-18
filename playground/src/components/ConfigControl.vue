<script setup lang="ts">
import type { GridPlanTheme } from "grid-plan";
import type { ConfigKey, ConfigValue } from "../types";
import { computed } from "vue";
import { defaultConfig, resolveConfig } from "grid-plan";
import { choices, numbers, label } from "../data/settings";
const props = defineProps<{ name: ConfigKey; theme: GridPlanTheme }>();
const value = defineModel<ConfigValue>({ required: true });
const original = computed(() =>
  props.name === "theme"
    ? defaultConfig.theme
    : resolveConfig({ theme: props.theme })[props.name],
);
const isColor = computed(
  () => typeof original.value === "string" && original.value.startsWith("#"),
);
function updateNumber(event: Event) {
  const target = event.target as HTMLInputElement;
  const input = Number(target.value);
  const constraint = numbers[props.name];
  if (!constraint) return;
  const { min, max, step } = constraint;
  if (target.value !== "" && Number.isFinite(input)) {
    value.value = Number(
      Math.min(max, Math.max(min, Math.round(input / step) * step)).toFixed(3),
    );
  }
  target.value = String(value.value);
}
</script>

<template>
  <div class="control-row" :class="{ modified: value !== original }">
    <label :for="`setting-${name}`"
      ><span>{{ label(name) }}</span
      ><code>{{ name }}</code></label
    >
    <input
      v-if="typeof original === 'boolean'"
      :id="`setting-${name}`"
      v-model="value"
      type="checkbox"
      class="toggle"
    />
    <select v-else-if="choices[name]" :id="`setting-${name}`" v-model="value">
      <option v-for="option in choices[name]" :key="option" :value="option">
        {{ option }}
      </option>
    </select>
    <div v-else-if="isColor" class="color-control">
      <input
        :id="`setting-${name}`"
        :value="String(value).slice(0, 7)"
        type="color"
        @change="value = ($event.target as HTMLInputElement).value"
      />
      <input
        v-model.lazy="value"
        type="text"
        :aria-label="`${label(name)} CSS color`"
      />
    </div>
    <input
      v-else-if="numbers[name] && typeof value === 'number'"
      :id="`setting-${name}`"
      :value="value"
      type="number"
      v-bind="numbers[name]"
      @change="updateNumber"
    />
    <input v-else :id="`setting-${name}`" v-model.lazy="value" type="text" />
    <button
      v-if="value !== original"
      class="reset-field"
      :aria-label="`Reset ${label(name)}`"
      :title="`Default: ${original}`"
      @click="value = original"
    >
      ↺
    </button>
  </div>
</template>
