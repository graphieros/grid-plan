<script setup lang="ts">
import type { GridPlanResolvedConfig } from "grid-plan";
import type { ConfigKey, ConfigValue } from "../types";
import { computed, ref } from "vue";
import { defaultConfig, resolveConfig } from "grid-plan";
import { groups, label } from "../data/settings";
import ConfigControl from "./ConfigControl.vue";
const config = defineModel<GridPlanResolvedConfig>({ required: true });
const search = ref("");
const filteredGroups = computed(() =>
  groups
    .map((group) => ({
      ...group,
      keys: group.keys.filter((key) =>
        `${group.title} ${key} ${label(key)}`
          .toLowerCase()
          .includes(search.value.toLowerCase().trim()),
      ),
    }))
    .filter((group) => group.keys.length),
);
function updateSetting(key: ConfigKey, value: ConfigValue) {
  if (key === "theme" && (value === "dark" || value === "light")) {
    const previous = resolveConfig({ theme: config.value.theme });
    const overrides = Object.fromEntries(
      Object.entries(config.value).filter(
        ([key, setting]) => setting !== previous[key as ConfigKey],
      ),
    );
    config.value = resolveConfig({ ...overrides, theme: value });
  } else config.value = { ...config.value, [key]: value };
}
</script>

<template>
  <aside class="settings panel" aria-label="Configuration controls">
    <div class="settings-heading">
      <h2>Configuration</h2>
      <span class="badge">{{ Object.keys(defaultConfig).length }} options</span>
    </div>
    <input
      v-model="search"
      class="search"
      type="search"
      placeholder="Find a setting…"
      aria-label="Find a setting"
    />
    <p class="settings-note">
      Changes apply live. Number and color inputs apply when committed.
    </p>
    <p v-if="!filteredGroups.length" class="empty">No matching settings.</p>
    <details
      v-for="group in filteredGroups"
      :key="group.title"
      class="control-group"
      open
    >
      <summary>
        {{ group.title }} <span>{{ group.keys.length }}</span>
      </summary>
      <p class="group-hint">{{ group.hint }}</p>
      <ConfigControl
        v-for="key in group.keys"
        :key="key"
        :name="key"
        :theme="config.theme"
        :model-value="config[key]"
        @update:model-value="updateSetting(key, $event)"
      />
    </details>
  </aside>
</template>
