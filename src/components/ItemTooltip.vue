<script setup>
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  watchPostEffect,
} from "vue";
import defaultConfig from "../default_config.json";
import { positionTooltip } from "../lib/tooltip-position";
const props = defineProps({
  item: { type: Object, required: true },
  config: { type: Object, default: () => ({}) },
  container: Object,
  getAnchor: { type: Function, required: true },
  isSelected: Boolean,
  coordinates: String,
  view: String,
  preferred: { type: String, default: "top" },
  color: { type: String, default: "#ffffff" },
  fontFamily: { type: String, default: "Arial" },
});

const element = ref(null);
const layout = ref(null);
let frame, observer;

const slotProps = computed(() => ({
  item: props.item,
  isSelected: props.isSelected,
  coordinates: props.coordinates,
  view: props.view,
}));

const cssLength = (value) => (typeof value === "number" ? `${value}px` : value);
const appearance = computed(() => {
  const c = { ...defaultConfig, ...props.config };
  return {
    color: props.config.tooltipColor ?? props.color,
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

function constrained(value, limit) {
  return value === "none" ? `${limit}px` : `min(${value}, ${limit}px)`;
}

const style = computed(() => ({
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
  observer.observe(element.value);
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
    :style="style"
  >
    <slot v-bind="slotProps">
      <strong style="display: block; margin-bottom: 4px">{{
        item.description || "Item"
      }}</strong>
      <div>{{ coordinates }}</div>
      <div>
        Size: {{ item.w }} × {{ item.h }} · Depth: {{ item.depth ?? 1 }}
      </div>
      <div>
        Type: {{ item.typeId
        }}<template v-if="item.id != null"> · ID: {{ item.id }}</template>
      </div>
    </slot>
  </div>
</template>
