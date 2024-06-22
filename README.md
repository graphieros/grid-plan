<p align="center">
    <a href="https://grid-plan.graphieros.com/"><img src="https://vue-data-ui.graphieros.com/grid-plan.png"></a>
    <br>
    <br>
    <br>
</p>

# grid-plan

![npm](https://img.shields.io/npm/v/grid-plan)
![NPM](https://img.shields.io/npm/l/grid-plan)
![npm](https://img.shields.io/npm/dt/grid-plan)
![GitHub issues](https://img.shields.io/github/issues/graphieros/grid-plan)

grid-plan is a Vue3 component to create blueprints for rooms, datacenters, racks, etc.

Create available component types, and place, resize or delete them from the blueprint.

grid-plan ships with:

- config options to customize the looks of your blueprint
- slots to customize icons related to component types

## Installation

```
npm i grid-plan
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

| Prop name      | TS type        | Required                            | Description                                                 |
| -------------- | -------------- | ----------------------------------- | ----------------------------------------------------------- |
| availableTypes | GridPlanItem[] | YES                                 | The types of components that can be placed on the blueprint |
| placedItems    | GridPlanItem[] | YES (can be empty)                  | Components already placed on the blueprint                  |
| placedItems    | boolean        | NO (default: false)                 | Blueprint will be readonly if true                          |
| config         | GridPlanConfig | NO (default config will be applied) | Configuration object to customize looks                     |

## Example

- Script:

```js
import { ref } from "vue";
import { GridPlan } from "grid-plan";

const availableTypes = ref([
  {
    color: "#3366DD",
    description: "server",
    icon: "S",
    typeId: 1,
  },
  {
    color: "#DD6633",
    description: "power",
    icon: "P",
    typeId: 2,
  },
  {
    color: "#71a4a8",
    description: "monitor",
    icon: "M",
    typeId: 3,
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
  coordinatesBackground: "#2A2A2A",
  coordinatesColor: "#8A8A8A",
  crosshairBackground: "#4A4A4A",
  fontFamily: "Arial",
  gridFill: "#3A3A3A",
  gridHeight: 42,
  gridHighlightColor: "#00FF00",
  gridStroke: "#1A1A1A",
  gridStrokeWidth: 0.02,
  gridWidth: 12,
  handleFill: "#FFFFFF",
  handleSize: 0.3,
  iconColor: "#1A1A1A",
  ordinatesType: "numeric",
  showCrosshair: true,
  tooltipColor: "#FFFFFF",
  useGradient: true,
  useShadow: true,
});

// Events
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
  // Pressing ESC will treigger unselect
  // Selecting an already selected item will trigger unselect
  console.log("BLUEPRINT IS NOW UNSELECTED");
}
```

- Template:

```html
<template>
  <GridPlan
    :availableTypes="availableTypes"
    ref="plan"
    :config="config"
    :placedItems="placedItems"
    @change="change"
    @delete="deleteItem"
    @select="selectItem"
    @created="createdItem"
    @unselect="unselected"
  >
    <!-- Create your available types menu -->
    <template #availableType="{ availableType }">
      <!-- The click event is managed by the component, that will select the type to be used when adding a component to the blueprint -->
      <button>{{ availableType.description }}</button>
    </template>

    <!-- Customize the icon for component types -->
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
      <!-- You can create as many custom icons as there are types -->
    </template>

    <!-- Or use this slot to display a single letter or an icon font -->
    <template #componentText="{ placedItem }"> {{ placedItem.icon }} </template>
  </GridPlan>
</template>
```

## Config details

| Attribute             | TS type                   | Default      | Description                                        |
| --------------------- | ------------------------- | ------------ | -------------------------------------------------- |
| abscissaType          | "alphabetic" OR "numeric" | "alphabetic" | Display abscissa coordinates as letters or numbers |
| coordinatesBackground | string                    | "#2A2A2A"    | Background color of the coordinates cells          |
| coordinatesColor      | string                    | "#8A8A8A"    | Text color of the coordinates cells                |
| crosshairBackground   | string                    | "#4A4A4A"    | Background color of the crosshair                  |
| fontFamily            | string                    | "Arial"      | Font used for all elements in the component        |
| gridFill              | string                    | "#3A3A3A"    | Background color of unused blueprint cells         |
| gridHeight            | number                    | 20           | The height of the blueprint in cell units          |
| gridHighlightColor    | string                    | "#FFFFFF"    | The contour of available cells on hover            |
| gridStroke            | string                    | "#1A1A1A"    | The color of grid lines                            |
| gridWidth             | number                    | 20           | The width of the blueprint in cell units           |
| handleFill            | string                    | "#FFFFFF"    | The color of resize handles                        |
| handleSize            | number                    | 0.3          | The handle size                                    |
| iconColor             | string                    | "#1A1A1A"    | The text color when using the #componentText slot  |
| ordinatesType         | "alphabetic" OR "numeric" | "numeric"    | Display ordinate coordinates as letters or numbers |
| showCrosshair         | boolean                   | true         | Show crosshair when hovering available cells       |
| tooltipColor          | string                    | "#FFFFFF"    | The tooltip text color                             |
| useGradient           | boolean                   | true         | Shows components with a subtle gradient            |
| useShadow             | boolean                   | true         | Show selected item with a drop shadow              |
