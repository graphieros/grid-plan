<p align="center">
    <a href="https://grid-plan.graphieros.com/"><img width="500" src="https://github.com/user-attachments/assets/fcfe7151-419e-4a3f-98f6-92491d917db0"></a>
    <br>
    <a href="https://grid-plan.graphieros.com/"><img width="500" src="https://github.com/user-attachments/assets/acf2ec8f-a520-445d-a8eb-3ae5f09ffd8a"></a>
    <br>
    <a href="https://grid-plan.graphieros.com/"><img width="200" src="https://github.com/user-attachments/assets/75eb428f-984d-4b5b-ad13-bbeba7fcab04"></a>
</p>

# grid-plan

![npm](https://img.shields.io/npm/v/grid-plan)
![npm](https://img.shields.io/npm/dt/grid-plan)
![GitHub issues](https://img.shields.io/github/issues/graphieros/grid-plan)

grid-plan is a Vue3 component to create blueprints for rooms, datacenters, racks, etc.

Create available component types, and place, resize or delete them from the blueprint.

grid-plan ships with:

- config options to customize the looks of your blueprint
- slots to customize icons related to component types
- slots to create your available components menu and your inventory

## Installation

```
pnpm add grid-plan
```

Three.js is an optional peer dependency, required only when displaying the 3D layout.
For 2D-only usage, install `grid-plan` and set `showGrid3d` to `false`:

```html
<GridPlan :config="{ showGrid3d: false }" />
```

The 3D layout is enabled by default. To use it, install Three.js:

```bash
pnpm add grid-plan three
```

You can declare the component globally in your main.js:

```js
import { createApp } from "vue";
import App from "./App.vue";

import { GridPlan } from "grid-plan";

const app = createApp(App);

app.component("GridPlan", GridPlan);
app.mount("#app");
```

Or you can import it directly in your Vue file:

```html
<script setup>
  import { GridPlan } from "grid-plan";
</script>
```

## Props

| Prop name      | TS type            | Required                            | Description                                                 |
| -------------- | ------------------ | ----------------------------------- | ----------------------------------------------------------- |
| availableTypes | GridPlanItemType[] | YES                                 | The types of components that can be placed on the blueprint |
| placedItems    | GridPlanItem[]     | YES (can be empty)                  | Components already placed on the blueprint                  |
| readonly       | boolean            | NO (default: false)                 | Blueprint will be readonly if true                          |
| config         | GridPlanConfig     | NO (default config will be applied) | Configuration object to customize looks                     |

## Example

- Script:

```js
import { ref } from "vue";
import { GridPlan } from "grid-plan";

const availableTypes = ref([
  {
    typeId: 1,
    color: "#3366DD",
    description: "server",
    icon: "server",
    iconColor: "#FFFFFF",
    depth: 2, // optional item height (defaults to 1 (grid cell size) if not provided)
  },
  {
    typeId: 2,
    color: "#DD6633",
    description: "power",
    icon: "bolt",
    iconColor: "#FFFFFF",
  },
  {
    typeId: 3,
    color: "#71a4a8",
    description: "monitor",
    icon: "deviceLaptop",
    iconColor: "#1A1A1A",
  },
]);

const placedItems = ref([
  { x: 0, y: 0, h: 1, w: 12, typeId: 1 }, // it's a server component
  { x: 0, y: 1, h: 4, w: 12, typeId: 3 }, // it's a monitor component
]);

// Config is optional
// You can provide a partial config, as missing attributes will use defaults
const config = ref({
  abscissaType: "alphabetic",
  accordionMenuTitle: "Menu",
  coordinatesBackground: "#2A2A2A",
  coordinatesColor: "#8A8A8A",
  crosshairBackground: "#4A4A4A",
  fontFamily: "Arial",
  grid3dPosition: "top",
  gridFill: "#3A3A3A",
  gridHeight: 42,
  gridHighlightColor: "#00FF00",
  gridStroke: "#1A1A1A",
  gridStrokeWidth: 0.02,
  gridWidth: 12,
  handleFill: "#FFFFFF",
  handleSize: 0.3,
  iconColor: "#1A1A1A",
  showIcons: true,
  nonSelectedOpacity: 0.3,
  ordinatesType: "numeric",
  showCrosshair: true,
  showGrid3d: true,
  showGrid2d: true,
  tooltipColor: "#FFFFFF",
  useAccordionMenu: true,
  useGradient: true,
  useShadow: true,
  showBox: true,
  boxThickness: 0.3,
  boxHeight: 1,
  boxColor: "#5A5A5A",
});

// Events

function selectType(menuItem) {
  // Triggered when a menu item is selected
  console.log("SELECT TYPE", menuItem);
}

function change(item) {
  // Triggered whenever an item is changed
  console.log("CHANGED", item);
}

function deleteItem(item) {
  // Triggered whenever an item is deleted
  console.log("DELETED", item);
}

function selectItem(item) {
  // Triggered whenever an item is selected
  console.log("SELECTED", item);
}

function createdItem(item) {
  // Triggered whenever an item is created
  console.log("CREATED", item);
}

function unselected() {
  // Triggered when an item is unselected
  // Pressing ESC will trigger unselect
  // Selecting an already selected item will trigger unselect
  console.log("BLUEPRINT IS NOW UNSELECTED");
}
```

- Template:

```html
<template>
  <GridPlan
    ref="plan"
    :availableTypes
    :config
    :placedItems
    @change="change"
    @delete="deleteItem"
    @select="selectItem"
    @created="createdItem"
    @unselect="unselected"
    @selectType="selectType"
  >
    <!-- A slot to do whatever you need before the component -->
    <template
      #before="{ items, deleteItem, focusItem, getFocusState, activeEntity }"
    >
      <div>ACTIVE ENTITY: {{ activeEntity }}</div>
      <div v-for="item in items">
        {{ item.description }}
        <button @click="deleteItem(item)">DELETE</button>
        <button @click="focusItem(item)">DELETE</button>
        FOCUS STATE: {{ getFocusState(item) }}
      </div>
    </template>

    <!-- Create your available types menu -->
    <template #availableType="{ availableType }">
      <!-- The click event is managed by the component, that will select the type to be used when adding a component to the blueprint -->
      <button>{{ availableType.description }}</button>
    </template>

    <!-- Create your inventory, which will be displayed inside a details element (target the .grid-plan-inventory css class to style) -->
    <template #inventory="{ item, deleteItem, focusItem, isFocused }">
      <div
        :style="`display: flex; flex-direction:row; flex-wrap: wrap; border: 1px solid ${item.color};width: fit-content; padding: 6px 12px; gap:6px; ${isFocused ? 'background: #FFFFFF20' : ''}`"
      >
        <span>{{ item.description }}</span>
        <span>x:{{ item.x }}</span>
        <span>y:{{ item.y }}</span>
        <span>h:{{ item.h }}</span>
        <span>w:{{ item.w }}</span>
        <button @click="deleteItem">DELETE</button>
        <button @click="focusItem">
          {{ isFocused ? 'UNFOCUS' : 'FOCUS' }}
        </button>
      </div>
    </template>

    <!-- Use your own svg icons for component types (not necessary if the icon provided is part of the available icons) -->
    <template #componentIcon="{ placedItem, maxSize }">
      <svg
        v-if="placedItem.description === 'server'"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="#FFFFFF"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        :style="`width:${maxSize}px; position: absolute; transform: scale(0.8, 0.8)`"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"
        />
        <path
          d="M3 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"
        />
        <path d="M7 8l0 .01" />
        <path d="M7 16l0 .01" />
        <path d="M11 8h6" />
        <path d="M11 16h6" />
      </svg>
    </template>

    <!-- Or use this slot to display a single letter or an icon font -->
    <template #componentText="{ placedItem }"> {{ placedItem.icon }} </template>

    <!-- A slot to do whatever you need after the component -->
    <template
      #after="{ items, deleteItem, focusItem, getFocusState, activeEntity }"
    >
      <div>ACTIVE ENTITY: {{ activeEntity }}</div>
      <div v-for="item in items">
        {{ item.description }}
        <button @click="deleteItem(item)">DELETE</button>
        <button @click="focusItem(item)">DELETE</button>
        FOCUS STATE: {{ getFocusState(item) }}
      </div>
    </template>
  </GridPlan>
</template>
```

## Config details

All properties are optional. Defaults below use the `dark` theme; `theme: "light"` applies a light palette. Explicit color overrides take precedence over the theme.

| Attribute                    | TS type                          | Default               | Description                                                                     |
| ---------------------------- | -------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| theme                        | "dark" OR "light"                | "dark"                | Color theme; explicit configuration overrides its palette                       |
| abscissaType                 | "alphabetic" OR "numeric"        | "alphabetic"          | Display abscissa coordinates as letters or numbers                              |
| accordionMenuTitle           | string                           | "Menu"                | Text content of detail summary                                                  |
| coordinatesBackground        | string                           | "#2A2A2A"             | Background color of the coordinates cells                                       |
| coordinatesColor             | string                           | "#8A8A8A"             | Text color of the coordinates cells                                             |
| crosshairBackground          | string                           | "#4A4A4A"             | Background color of the crosshair                                               |
| fontFamily                   | string                           | "Arial"               | Font used for all elements in the component                                     |
| itemNameFontSizeRatio        | number                           | 0.5                   | 2D hovered and selected item name font size, in grid units                      |
| itemCoordinatesFontSizeRatio | number                           | 0.4                   | 2D hovered and selected item coordinates font size, in grid units               |
| itemNameOffsetY              | number                           | 0                     | 2D hovered and selected name Y offset in grid units; positive moves down        |
| itemCoordinatesOffsetY       | number                           | 0                     | 2D hovered and selected coordinates Y offset in grid units; positive moves down |
| grid3dPosition               | "top" OR "bottom"                | "top"                 | Display 3d blueprint on top or below                                            |
| gridFill                     | string                           | "#3A3A3A"             | Background color of unused blueprint cells                                      |
| gridHeight                   | number                           | 20                    | The height of the blueprint in cell units                                       |
| gridHighlightColor           | string                           | "#FFFFFF"             | The contour of available cells on hover                                         |
| gridStroke                   | string                           | "#1A1A1A"             | The color of grid lines                                                         |
| gridStrokeWidth              | number                           | 0.02                  | Grid line width in cell units                                                   |
| gridWidth                    | number                           | 20                    | The width of the blueprint in cell units                                        |
| handleFill                   | string                           | "#FFFFFF"             | The color of resize handles                                                     |
| handleSize                   | number                           | 0.3                   | The handle size                                                                 |
| iconColor                    | string                           | "#1A1A1A"             | Default item icon and #componentText slot color                                 |
| showIcons                    | boolean                          | true                  | Show item icons in 2D and 3D, including the componentIcon slot                  |
| inventoryTitle               | string                           | "Inventory"           | The text content of the inventory details summary element                       |
| nonSelectedOpacity           | number                           | 0.3                   | The opacity of non selected components when a component is selected             |
| ordinatesType                | "alphabetic" OR "numeric"        | "numeric"             | Display ordinate coordinates as letters or numbers                              |
| showCrosshair                | boolean                          | true                  | Show crosshair when hovering available cells                                    |
| showGrid3d                   | boolean                          | false                 | Show the 3d blueprint                                                           |
| showGrid2d                   | boolean                          | true                  | Show the 2d blueprint                                                           |
| showMenu                     | boolean                          | true                  | Show the item type menu                                                         |
| showInventory                | boolean                          | true                  | Show inventory of placed components inside a details HTML element               |
| tooltipColor                 | string                           | "#FFFFFF"             | The tooltip text color                                                          |
| showTooltip                  | boolean                          | true                  | Show item tooltips in both views                                                |
| tooltipPosition              | "top", "bottom", "left", "right" | "top"                 | Preferred item tooltip placement; flips automatically                           |
| tooltipBackgroundColor       | string                           | "#202622f2"           | Tooltip background color                                                        |
| tooltipBorderRadius          | number OR string                 | 2                     | Tooltip corner radius; numbers are pixels                                       |
| tooltipLineHeight            | number OR string                 | 1.5                   | Tooltip line height; numbers are unitless                                       |
| tooltipPadding               | number OR string                 | "10px 14px"           | Tooltip padding; numbers are pixels                                             |
| tooltipBorder                | string                           | "1px solid #ffffff30" | Tooltip CSS border                                                              |
| tooltipBoxShadow             | string                           | "0 4px 16px #0003"    | Tooltip CSS box shadow                                                          |
| tooltipWidth                 | number OR string                 | "fit-content"         | Tooltip width; numbers are pixels                                               |
| tooltipMaxWidth              | number OR string                 | 280                   | Tooltip maximum width; numbers are pixels; constrained to the map               |
| tooltipMaxHeight             | number OR string                 | 400                   | Tooltip maximum height; numbers are pixels; constrained to the map              |
| useAccordionMenu             | boolean                          | true                  | Display the menu inside a details HTML element                                  |
| useGradient                  | boolean                          | true                  | Shows 2D components with a subtle gradient                                      |
| useShadow                    | boolean                          | true                  | Show selected item with a drop shadow                                           |
| showBox                      | boolean                          | true                  | Show a 'wall' around the grid                                                   |
| boxThickness                 | number                           | 0.3                   | Box thickness, defaults to 1/3 of a grid cell                                   |
| boxHeight                    | number                           | 1                     | Box height, defaults to the same size as a grid cell                            |
| boxColor                     | string                           | "#5A5A5A"             | Box color                                                                       |

## Custom item icons

`availableTypes[].icon` accepts a built-in name (for example `"server"`), a raw SVG
`d` string, an array of `d` strings, or a custom definition. These icons render in
the 2D blueprint and on the top face of 3D items, and inherit `iconColor`. Strings and arrays use a `0 0 24 24`
viewBox and an outline style.

```js
const availableTypes = [
  {
    typeId: "custom",
    description: "Custom equipment",
    color: "#6385ed",
    iconColor: "#ffffff",
    icon: "M12 3L21 12L12 21L3 12Z",
  },
  {
    typeId: "filled",
    description: "Filled icon",
    icon: {
      paths: ["M4 4H28V28H4Z"],
      viewBox: "0 0 32 32",
      fill: "currentColor",
      stroke: "none",
      // strokeWidth: 1.44, // default for outline icons, in viewBox units
    },
  },
];
```

Pass the contents of SVG `d` attributes, rather than an SVG markup string or an
image URL. The custom definition accepts `paths` as either a string or an array.
For arbitrary icon components or HTML, use the existing `componentIcon` slot.
Set `config.showIcons` to `false` to hide item icons in both views. It defaults to
`true` and also controls the `componentIcon` slot in both views. Text labels and delete-button
icons remain visible.

## Icon libraries with span or i elements

The `componentIcon` slot works in both views for items without a valid `icon`
definition. Load your library's CSS normally, then render its element:

```html
<GridPlan :placed-items="placedItems" :available-types="availableTypes">
  <template #componentIcon="{ placedItem, maxSize, iconColor }">
    <i
      :class="iconClasses[placedItem.typeId]"
      aria-hidden="true"
      :style="{
        fontSize: `${maxSize * 0.7}px`,
        lineHeight: 1,
        color: placedItem.iconColor || iconColor,
      }"
    />
  </template>
</GridPlan>
```

`iconClasses` maps your type IDs to your library's CSS classes. You can replace
`i` with `span` or a Vue icon component. Omit the type's `icon` property to use
this slot. `maxSize` is `32` pixels in both views. Size library icons in this
pixel-sized container using the font-size calculation shown above. The container scales to one grid unit, independently of the item's size,
so 1×1 items and larger items use the same icon size. In 3D, HTML icons lie on the
top face and follow the camera's perspective using CSS3DRenderer. They follow
edits, allow pointer interactions through them, and respect `showIcons`.

CSS3D icons are DOM elements layered over WebGL: other meshes do not occlude them.
Use SVG path icons when WebGL depth occlusion is needed.

## Item tooltips

Item tooltips are enabled by default in both views. Set `showTooltip` to `false` to disable them:

```js
config: {
  showTooltip: false,      // default: true
  tooltipPosition: 'top',  // top, bottom, left, or right
}
```

The hovered item takes priority; when the pointer leaves it, the selected item's
tooltip is shown. Tooltips also work in readonly mode. When enabled, they replace
the inline item labels. The preferred placement flips to the opposite side, then
tries the other sides to stay inside the map. Tooltips stay centered on the item
along the chosen side and constrain oversized content to the available space.
Their position follows item edits, camera movement, and container resizing.

All tooltip styles are configurable. These values preserve the default appearance:

```js
config: {
  showTooltip: true,
  tooltipColor: '#FFFFFF',
  tooltipBackgroundColor: '#202622f2',
  tooltipBorderRadius: 2,
  tooltipLineHeight: 1.5,
  tooltipPadding: '10px 14px',
  tooltipBorder: '1px solid #ffffff30',
  tooltipBoxShadow: '0 4px 16px #0003',
  tooltipWidth: "fit-content",
  tooltipMaxWidth: 280,
  tooltipMaxHeight: 400,
}
```

Numeric sizes are pixels; CSS length strings such as `'1rem'`, `'50%'`, or
`'calc(100% - 20px)'` are also accepted. Numeric `tooltipLineHeight` values are
unitless. Automatic boundary limits still apply to `maxWidth` and `maxHeight`,
so a larger configured tooltip stays within its map. Styles apply to default
content and custom slot content alike. These controls are in the playground's
**Tooltip** section; the color text inputs also accept alpha values.

Customize the content with the `tooltip` slot:

```html
<GridPlan
  :config="{ showTooltip: true }"
  :placed-items="placedItems"
  :available-types="availableTypes"
>
  <template #tooltip="{ item, coordinates, isSelected, view }">
    <strong>{{ item.description }}</strong>
    <div>{{ coordinates }} · {{ item.w }} × {{ item.h }}</div>
    <div>Depth: {{ item.depth ?? 1 }}</div>
    <small>{{ isSelected ? 'Selected' : 'Hovered' }} in {{ view }}</small>
  </template>
</GridPlan>
```

`item` is the full prepared element, including its ID, type information, icon,
texture, and any custom properties you supplied. `coordinates` is the formatted
coordinate range, `isSelected` indicates selection, and `view` is `"2d"` or `"3d"`.
The TypeScript type `GridPlanTooltipSlotProps` is also exported.

The playground's **Tooltip** section controls visibility and preferred placement.
Enable **Custom tooltip slot** in its toolbar to try the slot example.

## Custom delete icon

Use the `deleteIcon` slot to replace the trash icon inside the selected item's floating
square delete button in both 2D and 3D. It sits outside the item, preferring
the right side and switching to the left, bottom, or top to fit near map edges.
It receives `{ item }`, the selected item. The
button keeps its delete action, accessible label, and readonly behavior.

```html
<GridPlan :placed-items="placedItems" :available-types="availableTypes">
  <template #deleteIcon="{ item }">
    <svg
      viewBox="0 0 24 24"
      style="width: 100%; height: 100%"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
    </svg>
  </template>
</GridPlan>
```

You can also render an icon component in this slot. Size it to fill its container
with `width: 100%; height: 100%`. Omitting the slot preserves the default trash icon.

## Editing in 3D

The 3D blueprint supports the same `created`, `change`, `delete`, `select`, and
`unselect` events as the 2D blueprint. Both views share the same items and selection.

- Click an empty floor cell to create an item using the active type.
- Hover an empty floor cell to see its highlight and coordinates. `showCrosshair`
  controls the row and column shading. Cell highlights and hover coordinates are hidden in readonly mode.
- Drag an item to move it. Movement snaps to grid cells.
- Select an item and drag one of its four corner handles to resize its footprint.
- Use the selected item's Depth field to change its vertical size, or Delete to remove it.
- Press Escape to cancel an ongoing drag and clear the selection.
- Drag empty space to orbit the camera; use the mouse wheel to zoom.

Moving and resizing respect grid boundaries and prevent overlaps. The `readonly`
prop disables selection, creation, movement, resizing, depth changes, and deletion.
Hover information and camera navigation remain available. Switching to readonly
clears the current selection.

To display only the 3D blueprint, install the optional `three` peer dependency and use:

```html
<GridPlan
  :placed-items="placedItems"
  :available-types="availableTypes"
  :config="{ showGrid2d: false, showGrid3d: true }"
/>
```

The menu, inventory, and slots remain available in this mode. The 3D container
starts at 480px tall and can be resized using its corner.

## CSS classes

Grid Plan does not ship css.
To customize the styling of the menu and inventory, target the following css classes:

```css
.grid-plan-main {
}
.grid-plan-menu {
}
.grid-plan-menu__summary {
} /* If useAccordionMenu is true */
.grid-plan-menu__body {
} /* If useAccordionMenu is true */
.grid-plan-inventory {
}
.grid-plan-inventory__summary {
}
.grid-plan-inventory__body {
}
.grid-plan-grid {
}
.grid-plan-grid-3d {
}
.grid-plan-grid-3d-label {
}
```

## Icons

A set of icons is provided by grid-plan. These icons are adapted from the great [Tabler icons](https://tablericons.com/) open source icon library.

Icons are used in availableTypes:

```js
const availableTypes = ref([
  {
    color: '#6376DD',
    description: 'router',
    icon: 'router',
    typeId: 1,
    iconColor: '#FFFFFF'
  },
  {...}
])
```

| Icon name           |
| ------------------- |
| airConditioning     |
| alertTriangle       |
| analyze             |
| archive             |
| armchair            |
| award               |
| bath                |
| battery             |
| bed                 |
| bell                |
| bellSchool          |
| bolt                |
| boltOff             |
| books               |
| bulb                |
| bulfOff             |
| burger              |
| calculator          |
| camera              |
| cctv                |
| chefHat             |
| circleKey           |
| circuitCapacitor    |
| circuitCell         |
| circuitGround       |
| circuitSwitchClosed |
| circuitSwitchOpen   |
| clock               |
| cloud               |
| cloudComputing      |
| coffee              |
| cpu                 |
| cricuitLoop         |
| database            |
| deviceDesktop       |
| deviceDesktopOff    |
| deviceDualScreen    |
| deviceImac          |
| deviceImacOff       |
| deviceLaptop        |
| deviceLaptopOff     |
| deviceTablet        |
| deviceTabletOff     |
| deviceTv            |
| deviceTvOff         |
| deviceUsb           |
| devicesPc           |
| devicesPcOff        |
| disabled            |
| door                |
| doorEnter           |
| doorExit            |
| elevator            |
| elevatorOff         |
| escalator           |
| escalatorDown       |
| escalatorUp         |
| fingerprint         |
| firstAidKit         |
| folder              |
| folders             |
| headphones          |
| headset             |
| hexagon             |
| home                |
| key                 |
| keyboard            |
| leaf                |
| lock                |
| lockAccess          |
| man                 |
| microphone          |
| microscope          |
| network             |
| networkOff          |
| package             |
| packages            |
| paperclip           |
| phone               |
| plant               |
| plugConnected       |
| power               |
| printer             |
| printerOff          |
| prism               |
| propeller           |
| propellerOff        |
| reportAnalytics     |
| robot               |
| router              |
| salad               |
| server              |
| serverBolt          |
| serverCog           |
| serverOff           |
| shredder            |
| sofa                |
| solarPanel          |
| soup                |
| squareKey           |
| stack               |
| toilet              |
| toiletPaper         |
| toolsKitchen        |
| trafficCone         |
| trash               |
| trolley             |
| volume              |
| wall                |
| washMachine         |
| wave                |
| wifi                |
| windMill            |
| windmillOff         |
| window              |
| world               |

## Local playground development

The standalone demo lives in [`playground/`](playground/README.md) and consumes
the current package through its built `dist` exports. Install workspace dependencies, then run `pnpm run dev` from the root. This builds and watches the
library alongside the playground. Use `pnpm run build:playground` to build the
demo, or `pnpm run test:playground` for its tests.

The package also exports `defaultConfig`, which the playground uses to initialize
its configuration controls:

```js
import { GridPlan, defaultConfig } from "grid-plan";
const config = { ...defaultConfig };
```

## TypeScript

The package includes generated declarations at `dist/types/index.d.ts`.

```ts
import { GridPlan, defaultConfig } from "grid-plan";
import type {
  GridPlanConfig,
  GridPlanItem,
  GridPlanItemType,
  GridPlanTooltipSlotProps,
} from "grid-plan";

const config: GridPlanConfig = { ...defaultConfig, showTooltip: true };
// In a Vue script setup:
// const plan = ref<InstanceType<typeof GridPlan> | null>(null);
```

Keyboard navigation is available in both grid views. Tab to the grid, then use
Right/Down to focus the next item or Left/Up to focus the previous item, wrapping
through the current item order. Enter selects the focused item; Escape clears
focus and selection. In readonly mode, only arrow navigation is enabled.
Focused items show their information, including the `tooltip` slot when
`showTooltip` is enabled. Leaving the grid clears keyboard focus.

The tooltip exposes `data-position="top|bottom|left|right"` for custom CSS.
It reflects the actual placement after boundary adjustments, so styles follow
any automatic flip. For example:

```css
.grid-plan-tooltip[data-position="bottom"] {
  border-top: 2px solid currentColor;
}
```

The `theme` config option accepts `"dark"` (default, preserving the original
palette) or `"light"`. Both the 2D and 3D views update when it changes.
Explicit configuration values override theme defaults; item type colors stay
under your control.

```vue
<GridPlan :config="{ theme: 'light', gridHighlightColor: '#0d9488' }" />
```

Pass only the settings you want to override. Spreading `defaultConfig` into a
light config also explicitly overrides its palette with the dark defaults.
For a complete configuration with the chosen theme applied, use
`resolveConfig({ theme: 'light' })`, exported by `grid-plan`.
