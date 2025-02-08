<script setup>
import { ref } from "vue";
import LocalGridPlan from './components/GridPlan.vue';

const types = ref([
{
    color: '#BBCCCC',
    description: 'door',
    initial: 'D',
    typeId: 1,
    icon: 'door',
    iconColor: '#1A1A1A'
  },
  {
    color: '#8A8A8A',
    description: 'wall',
    initial: 'W',
    typeId: 2,
    icon: 'wall',
    iconColor: '#1A1A1A'
  },
  {
    color: '#3366DD',
    description: 'server',
    initial: 'C',
    typeId: 3,
    icon: 'server',
    iconColor: '#FFFFFF'
  },
  {
    color: "#DD6633",
    description: "power",
    initial: 'P',
    typeId: 4,
    icon: 'bolt',
    iconColor: 'yellow'
  },
  {
    color: "#71a4a8",
    description: "monitor",
    initial: 'M',
    typeId: 5,
    icon: 'deviceLaptop',
    iconColor: "white"
  },
  {
    color: '#1A1A1A',
    description: "router",
    initial: 'R',
    typeId: 6,
    icon: 'router',
    iconColor: '#FFFFFF'
  },
  {
    color: '#7aebab',
    description: "database",
    initial: 'D',
    typeId: 7,
    icon: 'database',
    iconColor: '#1A1A1A'
  },
  {
    color: '#f595e5',
    description: "phone",
    initial: 'P',
    typeId: 8,
    icon: 'phone',
    iconColor: '#1A1A1A'
  },
  {
    color: '#95d5f5',
    description: "AC",
    initial: 'P',
    typeId: 8,
    icon: 'airConditioning',
    iconColor: '#1A1A1A'
  },
])

const items = ref([
])

const config = ref({
  abscissaType: "alphabetic",
  coordinatesBackground: "#2A2A2A",
  coordinatesColor: "#8A8A8A",
  crosshairBackground: "#4A4A4A",
  fontFamily: "Arial",
  gridFill: "#3A3A3A",
  gridHeight: 32,
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
  showGrid3d: true,
  grid3dPosition: 'top'
})

function toggle3d() {
  config.value.showGrid3d = !config.value.showGrid3d;
}

const plan = ref(null)

function getItems() {
  console.log(plan.value.getItems())
}

function change(item) {
  // console.log('CHANGE', item)
}

function deleteItem(item) {
  // console.log('DELETE', item)
}

function selectItem(item) {
  // console.log('SELECT', item)
}

function unselect() {
  // console.log('UNSELECTED')
}

function createdItem(item) {
  // console.log('CREATED',item)
}

</script>

<template>
  <button @click="getItems">GET ITEMS</button>
  <button @click="toggle3d">TOGGLE 3D</button>
  <main>
    <!-- <GridPlan ref="plan">
      <template #componentIcon="{ placedItem, maxSize }">
        <svg xmlns="http://www.w3.org/2000/svg" v-if="placedItem.description === 'server'" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round" :style="`width:${maxSize}px; position: absolute; top: 50%; left:50%; transform: translate(-50%,-50%) scale(0.8, 0.8)`">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
        <path d="M3 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
        <path d="M7 8l0 .01" />
        <path d="M7 16l0 .01" />
        <path d="M11 8h6" />
        <path d="M11 16h6" />
    </svg>

      <svg xmlns="http://www.w3.org/2000/svg" v-if="placedItem.description === 'wall'" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round" :style="`width:${maxSize}px; position: absolute; top: 50%; left:50%; transform: translate(-50%,-50%) scale(0.8, 0.8)`">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
        <path d="M4 8h16" />
        <path d="M20 12h-16" />
        <path d="M4 16h16" />
        <path d="M9 4v4" />
        <path d="M14 8v4" />
        <path d="M8 12v4" />
        <path d="M16 12v4" />
        <path d="M11 16v4" />
    </svg>

      <svg xmlns="http://www.w3.org/2000/svg" v-if="placedItem.description === 'door'" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round" :style="`width:${maxSize}px; position: absolute; top: 50%; left:50%; transform: translate(-50%,-50%) scale(0.8, 0.8)`">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M14 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
        <path d="M21 12a9 9 0 1 1 -18 0a9 9 0 0 1 18 0z" />
        <path d="M12.5 11.5l-4 4l1.5 1.5" />
        <path d="M12 15l-1.5 -1.5" />
    </svg>

      <svg xmlns="http://www.w3.org/2000/svg" v-if="placedItem.description === 'power'" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round" :style="`width:${maxSize}px; position: absolute; top: 50%; left:50%; transform: translate(-50%,-50%) scale(0.8, 0.8)`">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
    </svg>
      </template>
    </GridPlan> -->
    
    <LocalGridPlan 
      :availableTypes="types" 
      ref="plan" 
      :config="config" 
      :placedItems="items"
      @change="change"
      @delete="deleteItem"
      @select="selectItem"
      @created="createdItem"
      @unselect="unselect"
    >
      <template #inventory="{ item, deleteItem, focusItem, isFocused }">
        <div :style="`display: flex; flex-direction:row; flex-wrap: wrap; border: 1px solid ${item.color};width: fit-content; padding: 6px 12px; gap:6px; ${isFocused ? 'background: #FFFFFF20' : ''}`">
          <span>{{ item.description }}</span>
          <span>x:{{ item.x }}</span>
          <span>y:{{ item.y }}</span>
          <span>h:{{ item.h }}</span>
          <span>w:{{ item.w }}</span>
          <button @click="deleteItem">DELETE</button>
          <button @click="focusItem">{{ isFocused ? 'UNFOCUS' : 'FOCUS' }}</button>
        </div>
      </template>

      <template #availableType="{ availableType }">
        {{ availableType.description }}
      </template>

      <template #componentIcon="{ placedItem, maxSize }">

      <svg xmlns="http://www.w3.org/2000/svg" v-if="placedItem.description === 'power'" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round" :style="`width:${maxSize}px; scale(0.8, 0.8);`">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11" />
    </svg>

      <svg xmlns="http://www.w3.org/2000/svg" v-if="placedItem.description === 'monitor'" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF" fill="none" stroke-linecap="round" stroke-linejoin="round" :style="`width:${maxSize}px; scale(0.8, 0.8);`">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M3 19l18 0" />
  <path d="M5 6m0 1a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1z" />
    </svg>
      </template>

    </LocalGridPlan>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>

<style>
.grid-plan-inventory__body {
  display: flex;
  gap: 12px;
  padding: 12px;
  flex-wrap: wrap;
}
</style>