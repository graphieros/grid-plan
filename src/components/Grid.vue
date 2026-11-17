<script setup lang="ts">
import {
  computed,
  ref,
  watchPostEffect,
  watch,
} from "vue";
import type {
  GridViewProps,
  GridViewEvents,
  GridViewSlots,
  GridPlanPlacedItem,
  GridPlanSelection,
  GridPlanPoint,
  GridPlanResizeHandle,
  GridPlanPointerEvent,
} from "../types";
import { isPlacedItem } from "../types";
import { useItemKeyboard } from "../composables/useItemKeyboard";
import ItemTooltip from "./ItemTooltip.vue";
import { resolveGridIcon } from "../lib/grid-icon";
import { positionDeleteButton } from "../lib/delete-button-position";
import { editFootprint } from "../lib/grid3d-edit";

const props = withDefaults(defineProps<GridViewProps>(), {
  items: () => [],
  activeEntity: () => ({}),
  readonly: false,
});
const slots = defineSlots<GridViewSlots>();

const emit = defineEmits<GridViewEvents>();

function selectItem(item: GridPlanPlacedItem) {
  if (props.readonly) return;
  emit("selectItem", item);
}

function triggerAction(rect: GridPlanPoint) {
  if (props.readonly) return;
  emit("triggerAction", rect);
}

function unselect() {
  if (props.readonly) return;
  emit("unselect");
}

const width = computed(() => props.config.gridWidth);
const height = computed(() => props.config.gridHeight);
const SVG = ref<SVGSVGElement | null>(null);

const gridRects = computed(() => {
  const rects = [];
  for (let i = 0; i < height.value; i += 1) {
    for (let j = 0; j < width.value; j += 1) {
      rects.push({
        x: j,
        y: i,
      });
    }
  }
  return rects;
});

function convertElementsToIndividualWalls(element: GridPlanPlacedItem[]) {
  const walls: GridPlanPoint[] = [];
  element.forEach((coordinates) => {
    for (let i = 0; i < coordinates.h; i += 1) {
      for (let j = 0; j < coordinates.w; j += 1) {
        walls.push({
          x: coordinates.x + j,
          y: coordinates.y + i,
        });
      }
    }
  });
  return walls;
}

function numberToLetters(num: number) {
  let letters = "";
  while (num > 0) {
    let remainder = (num - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters;
}

const gridCoordinates = computed(() => {
  const abs = [];
  const ord = [];

  for (let i = 1; i <= props.config.gridWidth; i += 1) {
    if (props.config.abscissaType === "alphabetic") {
      abs.push(numberToLetters(i));
    } else {
      abs.push(i);
    }
  }
  for (let i = 1; i <= props.config.gridHeight; i += 1) {
    if (props.config.ordinatesType === "alphabetic") {
      ord.push(numberToLetters(i));
    } else {
      ord.push(i);
    }
  }

  return {
    abs,
    ord,
  };
});

const walls = computed(() =>
  convertElementsToIndividualWalls(
    props.items.filter((el) => el.id !== props.activeEntity.id),
  ),
);

const entity = computed<GridPlanSelection>(() => props.readonly ? {} : props.activeEntity);
const { focusedItem, clearKeyboardFocus, onKeyDown } = useItemKeyboard({
  items: () => props.items, selected: () => entity.value, readonly: () => props.readonly,
  select: selectItem, unselect,
});


const inactiveItems = computed(() =>
  props.items.filter(
    (item) =>
      item !== entity.value &&
      (entity.value.id === undefined || item.id !== entity.value.id),
  ),
);
const displayedItems = computed(() =>
  entity.value.x !== undefined
    ? [...inactiveItems.value, entity.value]
    : inactiveItems.value,
);

const isDown = ref(false);

const resizingHandle = ref<GridPlanResizeHandle | null>(null);

const initialDimensions = ref({ x: 0, y: 0, w: 0, h: 0 });
let startPoint: GridPlanPoint | null = null;
let startGridPoint: GridPlanPoint | null = null;
let editingItem: GridPlanPlacedItem | null = null;
let hasDragged = false;
let suppressClick = false;

function startMove(event: GridPlanPointerEvent) {
  if (props.readonly || !isPlacedItem(entity.value) || !SVG.value) return;
  const pointer = "touches" in event ? event.touches[0] : event;
  startPoint = { x: pointer.clientX, y: pointer.clientY };
  startGridPoint = getSVGCoords(event, SVG.value);
  editingItem = entity.value;
  initialDimensions.value = {
    x: entity.value.x,
    y: entity.value.y,
    w: entity.value.w,
    h: entity.value.h,
  };
  hasDragged = false;
  suppressClick = false;
  isDown.value = true;
}

function clickActive() {
  if (!suppressClick) unselect();
  suppressClick = false;
}

function getSVGCoords(evt: GridPlanPointerEvent, svg: SVGSVGElement) {
  const pt = svg.createSVGPoint();
  if ("touches" in evt && evt.touches.length) {
    pt.x = evt.touches[0].clientX;
    pt.y = evt.touches[0].clientY;
  } else {
    pt.x = (evt as MouseEvent).clientX;
    pt.y = (evt as MouseEvent).clientY;
  }

  const svgMatrix = svg.getScreenCTM();
  const transformedPt = pt.matrixTransform(svgMatrix!.inverse());

  return {
    x: transformedPt.x,
    y: transformedPt.y,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function move(e: GridPlanPointerEvent) {
  if (!isDown.value || props.readonly || !isPlacedItem(entity.value)) return;

  const pointer = "touches" in e ? e.touches[0] : e;
  if (
    startPoint &&
    Math.hypot(pointer.clientX - startPoint.x, pointer.clientY - startPoint.y) >
      4
  )
    hasDragged = true;
  if (!hasDragged) return;

  e.preventDefault();

  const coordinates = getSVGCoords(e, SVG.value!);

  const rounded = {
    x: Math.round(coordinates.x),
    y: Math.round(coordinates.y),
  };

  if (resizingHandle.value) {
    resizeEntity(rounded);
  } else {
    const newX = clamp(
      Math.round(initialDimensions.value.x + coordinates.x - startGridPoint!.x),
      0,
      width.value - entity.value.w,
    );

    const newY = clamp(
      Math.round(initialDimensions.value.y + coordinates.y - startGridPoint!.y),
      0,
      height.value - entity.value.h,
    );

    if (isColliding(newX, newY, entity.value.w, entity.value.h)) return;

    entity.value.x = newX;
    entity.value.y = newY;
  }
}

function isColliding(x: number, y: number, w: number, h: number) {
  for (let i = 0; i < w; i += 1) {
    for (let j = 0; j < h; j += 1) {
      if (walls.value.some((wall) => wall.x === x + i && wall.y === y + j)) {
        return true;
      }
    }
  }
  return false;
}

function isOverflowing(x: number, y: number, w: number, h: number) {
  return x + w > width.value || y + h > height.value || x < 0 || y < 0;
}

function drop() {
  if (!isDown.value || props.readonly || !isPlacedItem(entity.value)) return;
  isDown.value = false;
  resizingHandle.value = null;
  suppressClick = hasDragged;
  startPoint = null;
  editingItem = null;
  if (
    (["x", "y", "w", "h"] as const).some(
      (key) => entity.value[key] !== initialDimensions.value[key],
    )
  ) {
    emit("change", entity.value);
  }
}

function cancelEditing() {
  if (!isDown.value) return;
  if (editingItem) Object.assign(editingItem, initialDimensions.value);
  isDown.value = false;
  resizingHandle.value = null;
  startPoint = null;
  startGridPoint = null;
  editingItem = null;
  suppressClick = false;
}
watch(
  () => [
    props.activeEntity,
    props.readonly,
    props.config.gridWidth,
    props.config.gridHeight,
  ],
  cancelEditing,
);

function startResize(handle: GridPlanResizeHandle) {
  if (props.readonly || !isPlacedItem(entity.value)) return;
  startPoint = null;
  hasDragged = true;
  isDown.value = true;
  resizingHandle.value = handle;
  editingItem = entity.value;
  initialDimensions.value = {
    x: entity.value.x,
    y: entity.value.y,
    w: entity.value.w,
    h: entity.value.h,
  };
}

function resizeEntity(coordinates: GridPlanPoint) {
  if (!isPlacedItem(entity.value)) return;
  const next = editFootprint(
    initialDimensions.value,
    coordinates,
    resizingHandle.value,
    props.config,
  );
  if (
    !isColliding(next.x, next.y, next.w, next.h) &&
    !isOverflowing(next.x, next.y, next.w, next.h)
  ) {
    Object.assign(entity.value, next);
  }
}

const deleteButtonFocused = ref(false);
watch(() => entity.value.id, () => { deleteButtonFocused.value = false; });
const deleteButtonPosition = computed(() => {
  const item = entity.value;
  if (!isPlacedItem(item)) return null;
  return positionDeleteButton({ left: item.x, top: item.y, right: item.x + item.w, bottom: item.y + item.h },
    { width: width.value, height: height.value }, 0.65, props.config.handleSize / 2 + 0.12);
});

function deleteEntity() {
  if (isPlacedItem(entity.value)) emit("delete", entity.value);
}

function itemCoordinates(item: GridPlanPlacedItem) {
  if (item.h === 1 && item.w === 1) {
    return `${gridCoordinates.value.abs[item.x]}-${gridCoordinates.value.ord[item.y]}`;
  }
  return `${gridCoordinates.value.abs[item.x]}-${gridCoordinates.value.ord[item.y]}, ${gridCoordinates.value.abs[item.x + item.w - 1]}-${gridCoordinates.value.ord[item.y + item.h - 1]}`;
}

const hoveredItem = ref<GridPlanPlacedItem | null>(null);
const gridContainer = ref<HTMLElement | null>(null);

const hoveredEntity = computed(() => {
  const id = hoveredItem.value?.id;
  if (id === undefined) return null;
  if (entity.value.id === id && isPlacedItem(entity.value)) return entity.value;
  return props.items.find((item) => item.id === id) ?? null;
});

const hoverCornerPaths = computed(() => {
  const item = hoveredEntity.value;
  if (!item || item.id === entity.value.id || isDown.value) return [];
  const gap = 0.12;
  const length = 0.25;
  const left = item.x - gap;
  const right = item.x + item.w + gap;
  const top = item.y - gap;
  const bottom = item.y + item.h + gap;
  return [
    `M ${left} ${top + length} V ${top} H ${left + length}`,
    `M ${right - length} ${top} H ${right} V ${top + length}`,
    `M ${left} ${bottom - length} V ${bottom} H ${left + length}`,
    `M ${right - length} ${bottom} H ${right} V ${bottom - length}`,
  ];
});

const tooltipItem = computed(
  () =>
    focusedItem.value ?? hoveredEntity.value ?? (entity.value.x !== undefined ? entity.value : null),
);

function tooltipAnchor() {
  const item = tooltipItem.value;
  const matrix = SVG.value?.getScreenCTM?.();
  if (!item || !matrix) return null;
  const points = [
    [item.x, item.y],
    [item.x + item.w, item.y],
    [item.x, item.y + item.h],
    [item.x + item.w, item.y + item.h],
  ].map(([x, y]) => ({
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  }));
  return {
    left: Math.min(...points.map((p) => p.x)),
    right: Math.max(...points.map((p) => p.x)),
    top: Math.min(...points.map((p) => p.y)),
    bottom: Math.max(...points.map((p) => p.y)),
  };
}

const itemNameFontSizeRatio = computed(
  () => props.config.itemNameFontSizeRatio ?? 0.4,
);

const itemCoordinatesFontSizeRatio = computed(
  () => props.config.itemCoordinatesFontSizeRatio ?? 0.4,
);

const infoItems = computed(() => {
  if (props.config.showTooltip) {
    return [];
  }

  const result = entity.value.x !== undefined ? [entity.value] : [];

  if (
    hoveredEntity.value &&
    !result.some((item) => item.id === hoveredEntity.value?.id)
  ) {
    result.push(hoveredEntity.value);
  }

  if (focusedItem.value && !result.some(item => item.id === focusedItem.value?.id)) result.push(focusedItem.value);
  return result;
});

// Reserve the same space before and during interaction so hovering or dragging
// at an edge does not change the grid scale underneath the pointer.
const labelWidth = ref(0);
const labelContent = computed(() => {
  const names = [...new Set(props.items.map((item) => item.description ?? ""))];
  const abs =
    [...gridCoordinates.value.abs].sort(
      (a, b) => String(b).length - String(a).length,
    )[0] ?? "";
  const ord =
    [...gridCoordinates.value.ord].sort(
      (a, b) => String(b).length - String(a).length,
    )[0] ?? "";
  return [
    ...names.map((text) => ({ text, size: itemNameFontSizeRatio.value })),
    {
      text: `${abs}-${ord}, ${abs}-${ord}`,
      size: itemCoordinatesFontSizeRatio.value,
    },
  ];
});

watchPostEffect(() => {
  const labels = labelContent.value;
  const font = props.config.fontFamily;
  if (!SVG.value) return;
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
  probe.style.visibility = "hidden";
  probe.setAttribute("font-family", font || "Arial");
  SVG.value.appendChild(probe);
  try {
    labelWidth.value = Math.max(
      0,
      ...labels.map(({ text, size }) => {
        probe.textContent = text;
        probe.setAttribute("font-size", String(size));
        return typeof probe.getComputedTextLength === "function"
          ? probe.getComputedTextLength()
          : text.length * size;
      }),
    );
  } finally {
    probe.remove();
  }
});

const viewport = computed(() => {
  const horizontal = Math.max(
    2,
    labelWidth.value / 2 + 0.25,
    (props.config.handleSize ?? 0.3) / 2 + 0.25,
  );
  const top = Math.max(2, (props.config.handleSize ?? 0.3) / 2 + 0.25)
    + Math.max(0, -props.config.itemNameOffsetY, -props.config.itemCoordinatesOffsetY);
  const bottom = Math.max(
    2,
    1.8 +
      itemNameFontSizeRatio.value +
      itemCoordinatesFontSizeRatio.value * 1.3,
  ) + Math.max(0, props.config.itemNameOffsetY, props.config.itemCoordinatesOffsetY);
  return `${-horizontal} ${-top} ${width.value + horizontal * 2} ${height.value + top + bottom}`;
});

function itemInfoTop(item: GridPlanPlacedItem) {
  const top = item.y + item.h + 0.5;
  const end =
    top +
    itemNameFontSizeRatio.value +
    0.3 +
    itemCoordinatesFontSizeRatio.value;
  return end < height.value ? top : Math.max(top, height.value + 1.3);
}

const hoveredRect = ref<GridPlanPoint | null>(null);

const highlightedCoordinates = computed(() => {
  if (!hoveredRect.value) return "";
  return `${gridCoordinates.value.abs[hoveredRect.value.x]}-${gridCoordinates.value.ord[hoveredRect.value.y]}`;
});

const highlightedTooltipPosition = computed(() => {
  if (!hoveredRect.value) return null;
  let x = hoveredRect.value.x + 0.5,
    y = hoveredRect.value.y + 2,
    textAnchor = "middle";
  if (hoveredRect.value.x === 0) {
    x = hoveredRect.value.x + 1.2;
    y = hoveredRect.value.y + 0.7;
    textAnchor = "start";
  } else if (hoveredRect.value.x === props.config.gridWidth - 1) {
    x = hoveredRect.value.x - 0.2;
    y = hoveredRect.value.y + 0.7;
    textAnchor = "end";
  }
  if (hoveredRect.value.y === props.config.gridHeight - 1) {
    y = hoveredRect.value.y - 0.5;
  }
  return {
    x,
    y,
    textAnchor,
  };
});

const decoratedItems = computed(() =>
  displayedItems.value.map((item) => ({
    item,
    icon: props.config.showIcons === false ? null : resolveGridIcon(item.icon),
  })),
);

function getTexturePatternId(item: GridPlanPlacedItem) {
  return `grid-plan-texture-${item.id ?? `${item.x}-${item.y}-${item.w}-${item.h}`}`;
}

function getItemFill(item: GridPlanPlacedItem) {
  if (item.texture?.src) {
    return `url(#${getTexturePatternId(item)})`;
  }

  return item.color || "#FFFFFF";
}
</script>

<template>
  <div
    tabindex="0"
    aria-label="2D grid editor"
    @keydown="onKeyDown"
    @blur="clearKeyboardFocus"
    @pointerdown="clearKeyboardFocus"
    @pointermove="clearKeyboardFocus"
    :style="{
      width: '100%',
      maxWidth: '100%',
      height: '100%',
      position: 'relative',
      overflowX: 'hidden',
      resize: 'horizontal',
    }"
    class="grid-plan-grid"
    ref="gridContainer"
  >
    <svg
      :viewBox="viewport"
      ref="SVG"
      @mousemove="move"
      @mouseup="drop"
      @touchmove="move"
      @touchend="drop"
      :style="{
        overflow: 'visible',
        fontFamily: config.fontFamily,
        width: '100%',
      }"
    >
      <!-- GRID COORDINATES -->
      <g v-for="(absCord, i) in gridCoordinates.abs">
        <rect
          :x="i"
          :y="-1"
          :height="1"
          :width="1"
          :fill="config.coordinatesBackground"
          :stroke="config.gridStroke"
          :stroke-width="config.gridStrokeWidth"
        />
        <text
          :x="i + 0.5"
          :y="-0.3"
          text-anchor="middle"
          :fill="config.coordinatesColor"
          font-size="0.5"
          style="user-select: none"
        >
          {{ absCord }}
        </text>
      </g>
      <g v-for="(absCord, i) in gridCoordinates.abs">
        <rect
          :x="i"
          :y="config.gridHeight"
          :height="1"
          :width="1"
          :fill="config.coordinatesBackground"
          :stroke="config.gridStroke"
          :stroke-width="config.gridStrokeWidth"
        />
        <text
          :x="i + 0.5"
          :y="config.gridHeight + 0.7"
          text-anchor="middle"
          :fill="config.coordinatesColor"
          font-size="0.5"
          style="user-select: none"
        >
          {{ absCord }}
        </text>
      </g>
      <g v-for="(ordCord, i) in gridCoordinates.ord">
        <rect
          :x="-1"
          :y="i"
          :height="1"
          :width="1"
          :fill="config.coordinatesBackground"
          :stroke="config.gridStroke"
          :stroke-width="config.gridStrokeWidth"
        />
        <text
          :x="-0.1"
          :y="i + 0.7"
          text-anchor="end"
          :fill="config.coordinatesColor"
          font-size="0.5"
          style="user-select: none"
        >
          {{ ordCord }}
        </text>
      </g>
      <g v-for="(ordCord, i) in gridCoordinates.ord">
        <rect
          :x="config.gridWidth"
          :y="i"
          :height="1"
          :width="1"
          :fill="config.coordinatesBackground"
          :stroke="config.gridStroke"
          :stroke-width="config.gridStrokeWidth"
        />
        <text
          :x="config.gridWidth + 0.1"
          :y="i + 0.7"
          text-anchor="start"
          :fill="config.coordinatesColor"
          font-size="0.5"
          style="user-select: none"
        >
          {{ ordCord }}
        </text>
      </g>

      <!-- GRID RECTS -->
      <rect
        v-for="rect in gridRects"
        :x="rect.x"
        :y="rect.y"
        :height="1"
        :width="1"
        :stroke="config.gridStroke"
        :stroke-width="config.gridStrokeWidth"
        :fill="
          !readonly &&
          config.showCrosshair !== false &&
          hoveredRect &&
          !isDown &&
          (hoveredRect.x === rect.x || hoveredRect.y === rect.y)
            ? config.crosshairBackground
            : config.gridFill
        "
        @click="triggerAction(rect)"
        @mouseover="hoveredRect = rect"
        @mouseleave="hoveredRect = null"
      />

      <rect
        v-if="!readonly && hoveredRect && !isDown"
        style="pointer-events: none"
        :x="hoveredRect.x"
        :y="hoveredRect.y"
        :height="1"
        :width="1"
        :stroke="config.gridHighlightColor"
        :stroke-width="config.gridStrokeWidth * 2"
        :fill="config.theme === 'light' ? '#2563EB20' : '#FFFFFF20'"
      />

      <!-- WALLS -->
      <rect
        v-for="wall in walls"
        :x="wall.x"
        :y="wall.y"
        :height="1"
        :width="1"
        fill="transparent"
      />

      <rect
        v-for="placedItem in inactiveItems"
        :x="placedItem.x"
        :y="placedItem.y"
        :height="placedItem.h"
        :width="placedItem.w"
        :fill="getItemFill(placedItem)"
        :stroke="config.gridStroke"
        :stroke-width="config.gridStrokeWidth"
        @mouseenter="
          hoveredItem = placedItem;
          hoveredRect = null;
        "
        @mouseleave="hoveredItem = null"
        @click="selectItem(placedItem)"
        :style="`opacity:${entity.id !== undefined ? (entity.id === placedItem.id ? '1' : config.nonSelectedOpacity) : '1'}`"
      />

      <defs>
        <radialGradient id="entityGradient" cx="30%" cy="30%" fx="0%" fy="0%">
          <stop offset="0%" stop-color="#FFFFFF00" />
          <stop offset="100%" stop-color="#FFFFFF20" />
        </radialGradient>

        <template v-for="placedItem in displayedItems">
          <pattern
            v-if="placedItem.x !== undefined && placedItem.texture?.src"
            :id="getTexturePatternId(placedItem)"
            patternUnits="objectBoundingBox"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <image
              :href="placedItem.texture.src"
              x="0"
              y="0"
              width="1"
              height="1"
              preserveAspectRatio="none"
            />
          </pattern>
        </template>
      </defs>

      <g v-if="config.useGradient">
        <rect
          v-for="placedItem in inactiveItems"
          :x="placedItem.x + 0.2"
          :y="placedItem.y + 0.2"
          :height="placedItem.h - 0.4"
          :width="placedItem.w - 0.4"
          fill="url(#entityGradient)"
          stroke="none"
          style="pointer-events: none"
        />
      </g>

      <!-- ACTIVE ENTITY -->
      <rect
        v-if="entity.x !== undefined"
        :x="entity.x"
        :y="entity.y"
        :width="entity.w"
        :height="entity.h"
        :fill="getItemFill(entity)"
        :stroke="config.gridStroke"
        :stroke-width="config.gridStrokeWidth"
        @mouseenter="
          hoveredItem = entity;
          hoveredRect = null;
        "
        @mouseleave="hoveredItem = null"
        @mousedown="startMove"
        @touchstart="startMove"
        @click="clickActive"
        :style="`cursor: ${readonly ? 'default' : 'move'}; ${config.useShadow ? '-webkit-filter: drop-shadow(0px 1px 0.5px rgba(0, 0, 0, 0.6)); filter: drop-shadow(0px 0px 0.5px rgba(0, 0, 0, 0.6))' : ''}`"
      />

      <g v-if="config.useGradient && entity.x !== undefined">
        <rect
          :x="entity.x + 0.2"
          :y="entity.y + 0.2"
          :height="entity.h - 0.4"
          :width="entity.w - 0.4"
          fill="url(#entityGradient)"
          stroke="none"
          style="pointer-events: none"
        />
      </g>

      <g v-for="{ item: placedItem, icon } in decoratedItems">
        <text
          v-if="placedItem.x !== undefined && slots.componentText"
          :x="placedItem.x + placedItem.w / 2"
          :y="placedItem.y + placedItem.h / 2 + 0.2"
          :font-size="0.6"
          :fill="placedItem.iconColor || config.iconColor"
          text-anchor="middle"
          :style="`opacity:${entity.id !== undefined ? (entity.id === placedItem.id ? '1' : config.nonSelectedOpacity) : '1'}; pointer-events: none; user-select: none`"
        >
          <slot
            name="componentText"
            v-bind="{ placedItem, iconColor: config.iconColor }"
          />
        </text>
        <svg
          v-if="
            config.showIcons !== false &&
            placedItem.x !== undefined &&
            slots.componentIcon &&
            !icon
          "
          class="grid-plan-component-icon"
          :x="placedItem.x + placedItem.w / 2 - 0.5"
          :y="placedItem.y + placedItem.h / 2 - 0.5"
          width="1"
          height="1"
          viewBox="0 0 32 32"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          :style="`opacity:${entity.id !== undefined ? (entity.id === placedItem.id ? '1' : config.nonSelectedOpacity) : '1'}; pointer-events: none; user-select: none`"
        >
          <foreignObject x="0" y="0" width="32" height="32">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              :style="{
                width: '32px',
                height: '32px',
                display: 'grid',
                placeItems: 'center',
                fontSize: '22.4px',
                lineHeight: 1,
                color: placedItem.iconColor || config.iconColor,
              }"
            >
              <slot
                name="componentIcon"
                v-bind="{
                  placedItem,
                  iconColor: config.iconColor,
                  maxSize: 32,
                }"
              />
            </div>
          </foreignObject>
        </svg>
        <svg
          v-if="icon"
          :x="placedItem.x + placedItem.w / 2 - 0.5"
          :y="placedItem.y + placedItem.h / 2 - 0.5"
          width="1"
          height="1"
          :viewBox="icon.viewBox"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          :style="{
            color: placedItem.iconColor || config.iconColor,
            opacity:
              entity.id !== undefined && entity.id !== placedItem.id
                ? config.nonSelectedOpacity
                : 1,
            pointerEvents: 'none',
          }"
        >
          <path
            v-for="(path, index) in icon.paths"
            :key="index"
            :d="path"
            :fill="icon.fill"
            :stroke="icon.stroke"
            :stroke-width="icon.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </g>

      <g v-if="hoverCornerPaths.length" class="grid-plan-hover-corners"
        fill="none" :stroke="config.handleFill" stroke-width="0.06"
        stroke-linecap="square" style="pointer-events: none" aria-hidden="true">
        <g :stroke="config.gridFill" stroke-width="0.1">
          <path v-for="(path, index) in hoverCornerPaths" :key="index" :d="path" />
        </g>
        <path v-for="(path, index) in hoverCornerPaths" :key="index" :d="path" />
      </g>

      <!-- HANDLES -->
      <g v-if="entity.x !== undefined && !readonly">
        <rect
          :x="entity.x - config.handleSize / 2"
          :y="entity.y - config.handleSize / 2"
          :fill="config.handleFill"
          :stroke="config.gridFill"
          :stroke-width="config.handleSize / 10"
          :height="config.handleSize"
          :width="config.handleSize"
          @mousedown.prevent="startResize('top-left')"
          @touchstart.prevent="startResize('top-left')"
          style="cursor: nwse-resize"
        />
        <rect
          :x="entity.x + entity.w - config.handleSize / 2"
          :y="entity.y - config.handleSize / 2"
          :fill="config.handleFill"
          :stroke="config.gridFill"
          :stroke-width="config.handleSize / 10"
          :height="config.handleSize"
          :width="config.handleSize"
          @mousedown.prevent="startResize('top-right')"
          @touchstart.prevent="startResize('top-right')"
          style="cursor: nesw-resize"
        />
        <rect
          :x="entity.x - config.handleSize / 2"
          :y="entity.y + entity.h - config.handleSize / 2"
          :fill="config.handleFill"
          :stroke="config.gridFill"
          :stroke-width="config.handleSize / 10"
          :height="config.handleSize"
          :width="config.handleSize"
          @mousedown.prevent="startResize('bottom-left')"
          @touchstart.prevent="startResize('bottom-left')"
          style="cursor: nesw-resize"
        />
        <rect
          :x="entity.x + entity.w - config.handleSize / 2"
          :y="entity.y + entity.h - config.handleSize / 2"
          :fill="config.handleFill"
          :stroke="config.gridFill"
          :stroke-width="config.handleSize / 10"
          :height="config.handleSize"
          :width="config.handleSize"
          @mousedown.prevent="startResize('bottom-right')"
          @touchstart.prevent="startResize('bottom-right')"
          style="cursor: nwse-resize"
        />
      </g>

      <!-- BUTTONS -->
      <g v-if="!readonly && entity.x !== undefined && deleteButtonPosition" class="grid-plan-delete-control"
        :data-position="deleteButtonPosition.side"
        :transform="`translate(${deleteButtonPosition.x} ${deleteButtonPosition.y})`">
        <rect class="grid-plan-delete-button" x="0" y="0" width="0.65" height="0.65"
          :fill="config.theme === 'light' ? '#475569CC' : '#CCCCCC66'"
          :stroke="config.handleFill" :stroke-width="deleteButtonFocused ? 0.07 : 0.025"
          @focus="deleteButtonFocused = true" @blur="deleteButtonFocused = false"
          role="button" tabindex="0" @keydown.enter.stop.prevent="deleteEntity"
          @keydown.space.stop.prevent="deleteEntity" :aria-label="`Delete ${entity.description ?? 'item'}`"
          @mousedown.stop.prevent
          @click.stop="deleteEntity" style="cursor: pointer; outline: none; outline-width: 0" />
        <foreignObject v-if="slots.deleteIcon" x="0.13" y="0.13" width="0.39" height="0.39"
          style="pointer-events: none; overflow: hidden">
          <div style="display: grid; place-items: center; width: 100%; height: 100%; color: white">
            <slot name="deleteIcon" :item="entity" />
          </div>
        </foreignObject>
        <svg v-else x="0.13" y="0.13" width="0.39" height="0.39" viewBox="0 0 24 24"
          aria-hidden="true" focusable="false" style="pointer-events: none">
          <path d="M3 6H21 M9 6V3H15V6 M5 6L6 21H18L19 6 M10 10V17 M14 10V17" stroke="white" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </g>

      <!-- TOOLTIPS -->
      <text
        v-if="!readonly && hoveredRect && !isDown && highlightedTooltipPosition"
        :text-anchor="highlightedTooltipPosition.textAnchor"
        :x="highlightedTooltipPosition.x"
        :y="highlightedTooltipPosition.y"
        :font-size="0.6"
        :fill="config.gridHighlightColor"
        style="user-select: none"
      >
        {{ highlightedCoordinates }}
      </text>

      <rect v-if="focusedItem" class="grid-plan-keyboard-focus"
        :x="focusedItem.x" :y="focusedItem.y" :width="focusedItem.w" :height="focusedItem.h"
        fill="none" :stroke="config.gridHighlightColor" :stroke-width="config.gridStrokeWidth * 2 + 0.04"
        stroke-dasharray="0.15 0.1" style="pointer-events: none" />

      <g
        v-for="infoItem in infoItems"
        :key="infoItem.id"
        class="grid-plan-item-info"
        style="pointer-events: none"
      >
        <text
          :x="infoItem.x + infoItem.w - infoItem.w / 2"
          :y="itemInfoTop(infoItem) + itemNameFontSizeRatio + config.itemNameOffsetY"
          :font-size="itemNameFontSizeRatio"
          :fill="config.tooltipColor"
          :stroke="config.theme === 'light' ? 'transparent' : 'black'"
          :stroke-width="0.011"
          style="pointer-events: none; user-select: none"
          text-anchor="middle"
        >
          {{ infoItem.description }}
        </text>
        <text
          :x="infoItem.x + infoItem.w - infoItem.w / 2"
          :y="
            itemInfoTop(infoItem) +
            0.3 +
            itemNameFontSizeRatio +
            itemCoordinatesFontSizeRatio +
            config.itemCoordinatesOffsetY
          "
          :font-size="itemCoordinatesFontSizeRatio"
          :fill="config.tooltipColor"
          style="pointer-events: none; user-select: none"
          :stroke="config.theme === 'light' ? 'transparent' : 'black'"
          :stroke-width="0.011"
          text-anchor="middle"
        >
          {{ itemCoordinates(infoItem) }}
        </text>
      </g>
    </svg>
    <ItemTooltip
      :config="config"
      v-if="config.showTooltip && tooltipItem"
      :item="tooltipItem"
      :container="gridContainer"
      :get-anchor="tooltipAnchor"
      :coordinates="itemCoordinates(tooltipItem)"
      view="2d"
      :is-selected="tooltipItem.id === entity.id"
      :preferred="config.tooltipPosition"
      :color="config.tooltipColor"
      :font-family="config.fontFamily"
    >
      <template v-if="$slots.tooltip" #default="slotProps"
        ><slot name="tooltip" v-bind="slotProps"
      /></template>
    </ItemTooltip>
  </div>
</template>

