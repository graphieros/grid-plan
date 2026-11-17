<script setup>
defineProps({ types: { type: Array, required: true }, activeType: [String, Number] });
defineEmits(['select']);
</script>
<template>
  <div class="type-palette" aria-label="Active item type">
    <span class="palette-label">Place</span>
    <button
      v-for="type in types"
      :key="type.typeId"
      :aria-pressed="activeType === type.typeId"
      @click="$emit('select', type)"
    >
      <span class="swatch" :style="{ background: type.color }"></span
      >{{ type.description }}
    </button>
  </div>
</template>
