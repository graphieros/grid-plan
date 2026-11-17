<script setup>
import { computed, ref, onMounted, onUnmounted, useSlots } from 'vue';
import { resolveGridIcon } from '../lib/grid-icon';
import { editFootprint } from '../lib/grid3d-edit';

const props = defineProps({
    /**
     * Already placed elements on the grid (walls, other entities...)
     * @example
     * [
     *  { x: 1, y: 1, w: 2, h: 3, color: "#FF0000" },
     *  { x: 1, y: 4, w: 2, h: 3, color: "#FF0000" },
     * ]
     */
    items: {
        type: Array,
        default() {
            return []
        }
    },
    /**
     * The active entity that can be moved and resized on available space
     * If none provided, the item will be positioned on the first available square
     * @example
     * { x: 1, y: 1, w: 1, h: 1, "#FF0000" }
     */
    activeEntity: {
        type: Object,
        default() {
            return {}
        }
    },
    config: {
        type: Object,
        default() {
            return {}
        }
    },
    readonly: {
        type: Boolean,
        default: false
    }
})

const slots = useSlots();

const emit = defineEmits(['change', 'selectItem', 'triggerAction', 'delete', 'unselect'])

function selectItem(item) {
    emit('selectItem', item)
}

function triggerAction(rect) {
    if (props.readonly) return;
    emit('triggerAction', rect)
}

function unselect() {
    emit('unselect')
}

function unselectOnKeypress(e) {
    if (e.key === 'Escape') {
        unselect()
    }
}

onMounted(() => {
    document.addEventListener('keydown', unselectOnKeypress);
});

onUnmounted(() => document.removeEventListener('keydown', unselectOnKeypress));

const width = ref(props.config.gridWidth);
const height = ref(props.config.gridHeight);
const SVG = ref(null);

const gridRects = computed(() => {
    const rects = [];
    for (let i = 0; i < height.value; i += 1) {
        for (let j = 0; j < width.value; j += 1) {
            rects.push({
                x: j,
                y: i
            });
        }
    }
    return rects;
});

function convertElementsToIndividualWalls(element) {
    const walls = [];
    element.forEach(coordinates => {
        for (let i = 0; i < coordinates.h; i += 1) {
            for (let j = 0; j < coordinates.w; j += 1) {
                walls.push({
                    x: coordinates.x + j,
                    y: coordinates.y + i
                });
            }
        }
    });
    return walls;
}

function numberToLetters(num) {
    let letters = '';
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
        if (props.config.abscissaType === 'alphabetic') {
            abs.push(numberToLetters(i));
        } else {
            abs.push(i);
        }
    }
    for (let i = 1; i <= props.config.gridHeight; i += 1) {
        if (props.config.ordinatesType === 'alphabetic') {
            ord.push(numberToLetters(i));  
        } else {
            ord.push(i);
        }
    }

    return {
        abs,
        ord
    };
});

const walls = ref(convertElementsToIndividualWalls(props.items.filter(el => el.id !== props.activeEntity.id)));

const entity = ref(props.activeEntity || {})

const inactiveItems = computed(() => props.items.filter(item =>
    item !== entity.value && (entity.value.id === undefined || item.id !== entity.value.id)
));
const displayedItems = computed(() => entity.value.x !== undefined
    ? [...inactiveItems.value, entity.value]
    : inactiveItems.value
);

const isDown = ref(false);
const resizingHandle = ref(null);
const initialDimensions = ref({ x: 0, y: 0, w: 0, h: 0 });
let startPoint = null;
let hasDragged = false;
let suppressClick = false;

function startMove(event) {
    if (props.readonly) return;
    const pointer = event.touches?.[0] ?? event;
    startPoint = { x: pointer.clientX, y: pointer.clientY };
    initialDimensions.value = { ...entity.value };
    hasDragged = false;
    suppressClick = false;
    isDown.value = true;
}

function clickActive() {
    if (!suppressClick) unselect();
    suppressClick = false;
}

function getSVGCoords(evt, svg) {
    const pt = svg.createSVGPoint();
    if (evt.touches && evt.touches.length) {
        pt.x = evt.touches[0].clientX;
        pt.y = evt.touches[0].clientY;
    } else {
        pt.x = evt.clientX;
        pt.y = evt.clientY;
    }

    const svgMatrix = svg.getScreenCTM();
    const transformedPt = pt.matrixTransform(svgMatrix.inverse());

    return {
        x: transformedPt.x,
        y: transformedPt.y
    };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function move(e) {
    if (!isDown.value || props.readonly) return;

    const pointer = e.touches?.[0] ?? e;
    if (startPoint && Math.hypot(pointer.clientX - startPoint.x, pointer.clientY - startPoint.y) > 4) hasDragged = true;
    if (!hasDragged) return;

    e.preventDefault();

    const coordinates = getSVGCoords(e, SVG.value);
    const rounded = {
        x: Math.round(coordinates.x),
        y: Math.round(coordinates.y)
    };

    if (resizingHandle.value) {
        resizeEntity(rounded);
    } else {
        const newX = clamp(
            Math.round(coordinates.x - entity.value.w / 2),
            0,
            width.value - entity.value.w
        );

        const newY = clamp(
            Math.round(coordinates.y - entity.value.h / 2),
            0,
            height.value - entity.value.h
        );

        if (isColliding(newX, newY, entity.value.w, entity.value.h)) return;

        entity.value.x = newX;
        entity.value.y = newY;
    }
}

function isColliding(x, y, w, h) {
    for (let i = 0; i < w; i += 1) {
        for (let j = 0; j < h; j += 1) {
            if (walls.value.some(wall => wall.x === x + i && wall.y === y + j)) {
                return true;
            }
        }
    }
    return false;
}

function isOverflowing(x, y, w, h) {
    return x + w > width.value || y + h > height.value || x < 0 || y < 0;
}

function drop() {
    if (!isDown.value || props.readonly) return;
    isDown.value = false;
    resizingHandle.value = null;
    suppressClick = hasDragged;
    startPoint = null;
    if (['x', 'y', 'w', 'h'].some(key => entity.value[key] !== initialDimensions.value[key])) {
        emit('change', entity.value);
    }
}

function startResize(handle) {
    if (props.readonly) return;
    startPoint = null;
    hasDragged = true;
    isDown.value = true;
    resizingHandle.value = handle;
    initialDimensions.value = { ...entity.value };
}

function resizeEntity(coordinates) {
    const next = editFootprint(initialDimensions.value, coordinates, resizingHandle.value, props.config);
    if (!isColliding(next.x, next.y, next.w, next.h) && !isOverflowing(next.x, next.y, next.w, next.h)) {
        Object.assign(entity.value, next);
    }
}

function deleteEntity() {
    emit('delete', entity.value)
}

function itemCoordinates(item) {
    if (item.h === 1 && item.w === 1) {
        return `${gridCoordinates.value.abs[item.x]}-${gridCoordinates.value.ord[item.y]}`;
    }
    return `${gridCoordinates.value.abs[item.x]}-${gridCoordinates.value.ord[item.y]}, ${gridCoordinates.value.abs[item.x + item.w - 1]}-${gridCoordinates.value.ord[item.y + item.h - 1]}`
}

const hoveredItem = ref(null);
const itemNameFontSizeRatio = computed(() => props.config.itemNameFontSizeRatio ?? 0.4);
const itemCoordinatesFontSizeRatio = computed(() => props.config.itemCoordinatesFontSizeRatio ?? 0.4);
const infoItems = computed(() => {
    const result = entity.value.x !== undefined ? [entity.value] : [];
    if (hoveredItem.value && !result.some(item => item.id === hoveredItem.value.id)) result.push(hoveredItem.value);
    return result;
});

const hoveredRect = ref(null)

const highlightedCoordinates = computed(() => {
    if(!hoveredRect.value) return ""
    return `${gridCoordinates.value.abs[hoveredRect.value.x]}-${gridCoordinates.value.ord[hoveredRect.value.y]}`
})

const highlightedTooltipPosition = computed(() => {
    if(!hoveredRect.value) return null;
    let x = hoveredRect.value.x + 0.5, y = hoveredRect.value.y + 2, textAnchor = 'middle';
    if (hoveredRect.value.x === 0) {
        x = hoveredRect.value.x + 1.2;
        y = hoveredRect.value.y + 0.7;
        textAnchor = 'start'
    } else if (hoveredRect.value.x === props.config.gridWidth - 1) {
        x = hoveredRect.value.x - 0.2;
        y = hoveredRect.value.y + 0.7;
        textAnchor = 'end'
    }
    if (hoveredRect.value.y === props.config.gridHeight - 1) {
        y = hoveredRect.value.y - 0.5;
    }
    return {
        x,
        y,
        textAnchor
    }
});

const decoratedItems = computed(() => displayedItems.value.map(item => ({
    item,
    icon: props.config.showIcons === false ? null : resolveGridIcon(item.icon),
})));

function getTexturePatternId(item) {
    return `grid-plan-texture-${item.id ?? `${item.x}-${item.y}-${item.w}-${item.h}`}`;
}

function getItemFill(item) {
    if (item.texture?.src) {
        return `url(#${getTexturePatternId(item)})`;
    }

    return item.color || '#FFFFFF';
}

</script>

<template>
    <div
        :style="{
            width: '100%',
            maxWidth: '100%',
            height: '100%',
            position: 'relative',
            overflowX: 'hidden',
            resize: 'horizontal'
        }"
        class="grid-plan-grid"
    >

        <svg :viewBox="`-1 -1 ${width+2} ${height+2}`" ref="SVG" @mousemove="move" @mouseup="drop" @touchmove="move" 
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
                    style="user-select: none;"
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
                    style="user-select: none;"
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
                    style="user-select: none;"
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
                    style="user-select: none;"
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
                :fill="hoveredRect && !isDown && (hoveredRect.x === rect.x || hoveredRect.y === rect.y) ? config.crosshairBackground : config.gridFill"
                @click="triggerAction(rect)"
                @mouseover="hoveredRect = rect"
                @mouseleave="hoveredRect = null"
            />

            <rect 
                v-if="hoveredRect && !isDown"
                style="pointer-events: none;"
                :x="hoveredRect.x"
                :y="hoveredRect.y"
                :height="1"
                :width="1"
                :stroke="config.gridHighlightColor"
                :stroke-width="config.gridStrokeWidth * 2"
                :fill="'#FFFFFF20'"
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
                @mouseenter="hoveredItem = placedItem; hoveredRect = null"
                @mouseleave="hoveredItem = null"
                @click="selectItem(placedItem)"
                :style="`opacity:${ activeEntity.id !== undefined ? activeEntity.id === placedItem.id ? '1' : config.nonSelectedOpacity : '1' }`"
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
                    style="pointer-events: none;"
                />
            </g>


            <!-- ACTIVE ENTITY -->
            <rect
                v-if="activeEntity && activeEntity.x !== undefined"
                :x="entity.x" 
                :y="entity.y" 
                :width="entity.w" 
                :height="entity.h" 
                :fill="getItemFill(entity)"
                :stroke="config.gridStroke"
                :stroke-width="config.gridStrokeWidth"
                @mouseenter="hoveredItem = entity; hoveredRect = null"
                @mouseleave="hoveredItem = null"
                @mousedown="startMove" 
                @touchstart="startMove"
                @click="clickActive"
                :style="`cursor: ${readonly ? 'default' : 'move'}; ${config.useShadow ? '-webkit-filter: drop-shadow(0px 1px 0.5px rgba(0, 0, 0, 0.6)); filter: drop-shadow(0px 0px 0.5px rgba(0, 0, 0, 0.6))' : ''}`"
            />

            <g v-if="config.useGradient && activeEntity && activeEntity.x !== undefined">
                <rect 
                    :x="entity.x + 0.2"
                    :y="entity.y + 0.2"
                    :height="entity.h - 0.4"
                    :width="entity.w - 0.4"
                    fill="url(#entityGradient)"
                    stroke="none"
                    style="pointer-events: none;"
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
                    :style="`opacity:${ activeEntity.id !== undefined ? activeEntity.id === placedItem.id ? '1' : config.nonSelectedOpacity : '1' }; pointer-events: none; user-select: none`"
                >
                    <slot name="componentText" v-bind="{placedItem, iconColor: config.iconColor}"/>
                </text>
                <svg
                    v-if="config.showIcons !== false && placedItem.x !== undefined && slots.componentIcon && !icon"
                    class="grid-plan-component-icon"
                    :x="placedItem.x + placedItem.w / 2 - 0.5"
                    :y="placedItem.y + placedItem.h / 2 - 0.5"
                    width="1" height="1" viewBox="0 0 32 32"
                    preserveAspectRatio="xMidYMid meet" aria-hidden="true"
                    :style="`opacity:${ activeEntity.id !== undefined ? activeEntity.id === placedItem.id ? '1' : config.nonSelectedOpacity : '1' }; pointer-events: none; user-select: none`"
                >
                    <foreignObject x="0" y="0" width="32" height="32">
                        <div xmlns="http://www.w3.org/1999/xhtml" :style="{
                            width: '32px', height: '32px', display: 'grid', placeItems: 'center',
                            fontSize: '22.4px', lineHeight: 1, color: placedItem.iconColor || config.iconColor,
                        }">
                            <slot name="componentIcon" v-bind="{ placedItem, iconColor: config.iconColor, maxSize: 32 }"/>
                        </div>
                    </foreignObject>
                </svg>
                <svg v-if="icon"
                    :x="placedItem.x + placedItem.w / 2 - 0.5"
                    :y="placedItem.y + placedItem.h / 2 - 0.5"
                    width="1" height="1" :viewBox="icon.viewBox"
                    preserveAspectRatio="xMidYMid meet" aria-hidden="true"
                    :style="{ color: placedItem.iconColor || config.iconColor,
                        opacity: activeEntity.id !== undefined && activeEntity.id !== placedItem.id ? config.nonSelectedOpacity : 1,
                        pointerEvents: 'none' }">
                    <path v-for="(path, index) in icon.paths" :key="index" :d="path"
                        :fill="icon.fill" :stroke="icon.stroke" :stroke-width="icon.strokeWidth"
                        stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </g>

            <!-- HANDLES -->
            <g v-if="activeEntity && activeEntity.x !== undefined && !readonly">
                <rect 
                    :x="entity.x - config.handleSize / 2" 
                    :y="entity.y - config.handleSize / 2" 
                    fill="white" 
                    :height="config.handleSize" 
                    :width="config.handleSize" 
                    @mousedown.prevent="startResize('top-left')"
                    @touchstart.prevent="startResize('top-left')"
                    style="cursor: nwse-resize"
                />
                <rect 
                    :x="entity.x + entity.w - config.handleSize / 2" 
                    :y="entity.y - config.handleSize / 2" 
                    fill="white" 
                    :height="config.handleSize" 
                    :width="config.handleSize" 
                    @mousedown.prevent="startResize('top-right')"
                    @touchstart.prevent="startResize('top-right')"
                    style="cursor: nesw-resize"
                />
                <rect 
                    :x="entity.x - config.handleSize / 2" 
                    :y="entity.y + entity.h - config.handleSize / 2" 
                    fill="white" 
                    :height="config.handleSize" 
                    :width="config.handleSize" 
                    @mousedown.prevent="startResize('bottom-left')"
                    @touchstart.prevent="startResize('bottom-left')"
                    style="cursor: nesw-resize"
                />
                <rect 
                    :x="entity.x + entity.w - config.handleSize / 2" 
                    :y="entity.y + entity.h - config.handleSize / 2" 
                    fill="white" 
                    :height="config.handleSize" 
                    :width="config.handleSize" 
                    @mousedown.prevent="startResize('bottom-right')"
                    @touchstart.prevent="startResize('bottom-right')"
                    style="cursor: nwse-resize"
                />
            </g>

            <!-- BUTTONS -->
            <g v-if="!readonly && activeEntity && activeEntity.x !== undefined">        
                <circle 
                    :cx="entity.x + entity.w / 2"
                    :cy="entity.y - 1"
                    :r="0.5"
                    :fill="'#CCCCCC66'"
                    @click="deleteEntity"
                    style="cursor: pointer"
                />
                <foreignObject v-if="slots.deleteIcon"
                    :x="entity.x + entity.w / 2 - 0.3" :y="entity.y - 1.3"
                    width="0.6" height="0.6" style="pointer-events: none; overflow: hidden;">
                    <div style="display: grid; place-items: center; width: 100%; height: 100%; color: white;">
                        <slot name="deleteIcon" :item="entity" />
                    </div>
                </foreignObject>
                <template v-else>
                <line
                    :x1="entity.x + entity.w / 2 - 0.25"
                    :x2="entity.x + entity.w / 2 + 0.25"
                    :y1="entity.y - 0.75"
                    :y2="entity.y - 1.25"
                    :stroke="'white'"
                    :stroke-width="0.09"
                    stroke-linecap="round"
                    style="pointer-events: none;"
                />
                <line
                    :x2="entity.x + entity.w / 2 - 0.25"
                    :x1="entity.x + entity.w / 2 + 0.25"
                    :y1="entity.y - 0.75"
                    :y2="entity.y - 1.25"
                    :stroke="'white'"
                    :stroke-width="0.09"
                    stroke-linecap="round"
                    style="pointer-events: none;"
                />
                </template>
            </g>

            <!-- TOOLTIPS -->
            <text
                v-if="hoveredRect && !isDown"
                :text-anchor="highlightedTooltipPosition.textAnchor"
                :x="highlightedTooltipPosition.x"
                :y="highlightedTooltipPosition.y"
                :font-size="0.6"
                :fill="config.gridHighlightColor"
                style="user-select: none;"
            >
                {{ highlightedCoordinates }}
            </text>

            <g v-for="infoItem in infoItems" :key="infoItem.id" class="grid-plan-item-info" style="pointer-events: none;">
            <text 
                :x="infoItem.x + infoItem.w - infoItem.w / 2"
                :y="infoItem.y + infoItem.h + 0.5 + itemNameFontSizeRatio"
                :font-size="itemNameFontSizeRatio"
                :fill="config.tooltipColor"
                :stroke="'black'"
                :stroke-width="0.011"
                style="pointer-events: none; user-select: none;"
                text-anchor="middle"
            >
                {{ infoItem.description }}
            </text>
            <text 
                :x="infoItem.x + infoItem.w - infoItem.w / 2"
                :y="infoItem.y + infoItem.h + 0.8 + itemNameFontSizeRatio + itemCoordinatesFontSizeRatio"
                :font-size="itemCoordinatesFontSizeRatio"
                :fill="config.tooltipColor"
                style="pointer-events: none; user-select: none;"
                :stroke="'black'"
                :stroke-width="0.011"
                text-anchor="middle"
            >
                {{ itemCoordinates(infoItem) }}
            </text>
            </g>
        </svg>
    </div>
</template>
