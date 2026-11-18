<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  watchPostEffect,
} from "vue";
import { useGridCoordinates } from "../composables/useGridCoordinates";
import { resolveConfig } from "../config";
import type {
  GridPlanPlacedItem,
  GridPlanConfig,
  GridPlanTooltipSlotProps,
  GridPlanTooltipPosition,
} from "../types";
import type { TooltipAnchor, TooltipLayout } from "../lib/tooltip-position";
import type { CSSProperties, VNodeChild } from "vue";
import { positionTooltip } from "../lib/tooltip-position";
const props = withDefaults(
  defineProps<{
    item: GridPlanPlacedItem;
    config?: GridPlanConfig;
    container?: HTMLElement | null;
    getAnchor: () => TooltipAnchor | null;
    isSelected?: boolean;
    coordinates?: string;
    view?: "2d" | "3d";
    preferred?: GridPlanTooltipPosition;
    color?: string;
    fontFamily?: string;
  }>(),
  {
    config: () => ({}),
    container: null,
    isSelected: false,
    coordinates: "",
    view: "2d",
    preferred: "top",
    color: "#ffffff",
    fontFamily: "Arial",
  },
);
defineSlots<{ default?: (scope: GridPlanTooltipSlotProps) => VNodeChild }>();

const element = ref<HTMLDivElement | null>(null);
const layout = ref<TooltipLayout | null>(null);
let frame: number, observer: ResizeObserver;

const { displayCoordinates } = useGridCoordinates(() =>
  resolveConfig(props.config),
);

const slotProps = computed(() => ({
  item: props.item,
  isSelected: props.isSelected,
  coordinates: props.coordinates,
  displayCoordinates: displayCoordinates(props.item),
  view: props.view,
}));

const cssLength = (value: string | number) =>
  typeof value === "number" ? `${value}px` : value;
const appearance = computed(() => {
  const c = resolveConfig(props.config);
  return {
    color:
      props.config.tooltipColor ??
      (props.config.theme ? c.tooltipColor : props.color),
    backgroundColor: c.tooltipBackgroundColor,
    borderRadius: cssLength(c.tooltipBorderRadius),
    lineHeight: c.tooltipLineHeight,
    padding: cssLength(c.tooltipPadding),
    border: c.tooltipBorder,
    boxShadow: c.tooltipBoxShadow,
    width: cssLength(c.tooltipWidth),
    maxWidth: cssLength(c.tooltipMaxWidth),
    maxHeight: cssLength(c.tooltipMaxHeight),
  };
});

function constrained(value: string, limit: number) {
  return value === "none" ? `${limit}px` : `min(${value}, ${limit}px)`;
}

const style = computed<CSSProperties>(() => ({
  ...appearance.value,
  position: "absolute",
  zIndex: 10,
  boxSizing: "border-box",
  pointerEvents: "none",
  left: `${layout.value?.left ?? 0}px`,
  top: `${layout.value?.top ?? 0}px`,
  maxWidth: layout.value
    ? constrained(appearance.value.maxWidth, layout.value.maxWidth)
    : appearance.value.maxWidth,
  maxHeight: layout.value
    ? constrained(appearance.value.maxHeight, layout.value.maxHeight)
    : appearance.value.maxHeight,
  visibility: layout.value ? "visible" : "hidden",
  overflow: "auto",
  overflowWrap: "anywhere",
  fontFamily: props.fontFamily,
  fontSize: "13px",
}));

function update() {
  if (!element.value || !props.container) return;
  const bounds = props.container.getBoundingClientRect();
  if (!bounds.width || !bounds.height) {
    layout.value = null;
    return;
  }
  const anchor = props.getAnchor();
  if (
    !anchor ||
    !bounds.width ||
    !bounds.height ||
    anchor.right < bounds.left ||
    anchor.left > bounds.right ||
    anchor.bottom < bounds.top ||
    anchor.top > bounds.bottom
  ) {
    layout.value = null;
    return;
  }
  const localAnchor = {
    left: anchor.left - bounds.left,
    right: anchor.right - bounds.left,
    top: anchor.top - bounds.top,
    bottom: anchor.bottom - bounds.top,
  };
  // Measure the configured CSS dimensions without a previous side's limits.
  // Measure again after constraining them: wrapped custom content can be taller.
  const node = element.value;
  const previous = {
    width: node.style.width,
    maxWidth: node.style.maxWidth,
    maxHeight: node.style.maxHeight,
    left: node.style.left,
    top: node.style.top,
  };

  let next;

  try {
    Object.assign(node.style, {
      width: appearance.value.width,
      maxWidth: appearance.value.maxWidth,
      maxHeight: appearance.value.maxHeight,
      left: "0px",
      top: "0px",
    });
    const natural = { width: node.offsetWidth, height: node.offsetHeight };
    next = positionTooltip(localAnchor, bounds, natural, props.preferred);
    Object.assign(node.style, {
      maxWidth: constrained(appearance.value.maxWidth, next.maxWidth),
      maxHeight: constrained(appearance.value.maxHeight, next.maxHeight),
    });
    next = positionTooltip(
      localAnchor,
      bounds,
      { width: node.offsetWidth, height: node.offsetHeight },
      next.side,
    );
  } finally {
    Object.assign(node.style, previous);
  }
  if (JSON.stringify(next) !== JSON.stringify(layout.value))
    layout.value = next;
}

function tick() {
  update();
  frame = requestAnimationFrame(tick);
}

watchPostEffect(() => {
  props.item;
  props.preferred;
  props.coordinates;
  update();
});

onMounted(() => {
  observer = new ResizeObserver(update);
  observer.observe(element.value!);
  if (props.container) observer.observe(props.container);
  tick();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  observer?.disconnect();
});
</script>

<template>
  <div
    ref="element"
    class="grid-plan-tooltip"
    role="tooltip"
    :data-side="layout?.side"
    :data-position="layout?.side"
    :style="style"
  >
    <slot v-bind="slotProps">
      <strong style="display: block; margin-bottom: 4px">{{
        item.description || "Item"
      }}</strong>
      <div>{{ coordinates }}</div>
    </slot>
  </div>
</template>
