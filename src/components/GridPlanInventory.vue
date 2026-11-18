<script setup lang="ts">
import type { GridPlanController, GridPlanInventorySlotProps } from "../types";
withDefaults(
  defineProps<{
    plan: GridPlanController;
    title?: string;
    accordion?: boolean;
  }>(),
  {
    title: "Inventory",
    accordion: true,
  },
);
defineSlots<{ default?: (scope: GridPlanInventorySlotProps) => unknown }>();
</script>

<template>
  <component
    :is="accordion ? 'details' : 'div'"
    class="grid-plan-inventory"
    :style="{ fontFamily: plan.config.fontFamily }"
  >
    <summary v-if="accordion" class="grid-plan-inventory__summary">
      {{ title }}
    </summary>
    <div class="grid-plan-inventory__body">
      <div
        v-for="item in plan.items"
        :key="item.id"
        @mouseenter="plan.hintItem(item)"
        @mouseleave="plan.hintItem(null)"
      >
        <slot
          :item="item"
          :display-coordinates="plan.displayCoordinates(item)"
          :delete-item="() => plan.deleteItem(item)"
          :focus-item="() => plan.focusItem(item)"
          :hint-item="() => plan.hintItem(item)"
          :clear-hint="() => plan.hintItem(null)"
          :is-focused="plan.getFocusState(item)"
        >
          <span
            >{{ item.description }} ·
            {{ plan.displayCoordinates(item).label }}</span
          >
          <button
            type="button"
            :disabled="plan.readonly"
            :aria-pressed="plan.getFocusState(item)"
            @click="plan.focusItem(item)"
          >
            {{ plan.getFocusState(item) ? "Unfocus" : "Focus" }}
          </button>
          <button
            type="button"
            :disabled="plan.readonly"
            @click="plan.deleteItem(item)"
          >
            Delete
          </button>
        </slot>
      </div>
    </div>
  </component>
</template>
