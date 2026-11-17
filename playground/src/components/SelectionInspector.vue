<script setup lang="ts">
import type { GridPlanPlacedItem } from "grid-plan";
defineProps<{ selected?: GridPlanPlacedItem | null }>();
</script>
<template>
  <section class="panel inspector">
    <div class="section-heading">
      <h2>Selection</h2>
      <span class="badge">{{ selected?.description || "None" }}</span>
    </div>
    <pre v-if="selected">{{ JSON.stringify(selected, null, 2) }}</pre>
    <p v-else class="empty">Select an item in either view to inspect it.</p>
  </section>
</template>
