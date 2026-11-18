<script setup lang="ts">
import type { GridPlanController, GridPlanMenuSlotProps } from "../types";
withDefaults(
  defineProps<{
    plan: GridPlanController;
    title?: string;
    accordion?: boolean;
  }>(),
  {
    title: "Menu",
    accordion: true,
  },
);
defineSlots<{ default?: (scope: GridPlanMenuSlotProps) => unknown }>();
</script>

<template>
  <component
    :is="accordion ? 'details' : 'div'"
    class="grid-plan-menu"
    :style="{ fontFamily: plan.config.fontFamily }"
  >
    <summary v-if="accordion" class="grid-plan-menu__summary">
      {{ title }}
    </summary>
    <div class="grid-plan-menu__body">
      <div v-for="type in plan.availableTypes" :key="type.typeId">
        <slot
          :available-type="type"
          :is-active="plan.activeType?.typeId === type.typeId"
          :select-type="() => plan.setActiveType(type)"
        >
          <button
            type="button"
            :disabled="plan.readonly"
            :aria-pressed="plan.activeType?.typeId === type.typeId"
            @click="plan.setActiveType(type)"
          >
            {{ type.description }}
          </button>
        </slot>
      </div>
    </div>
  </component>
</template>
