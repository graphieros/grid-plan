<script setup >
import { ref, computed, onMounted, toRefs, watch } from "vue"
import Grid from "./Grid.vue";
import Grid3d from "./Grid3d.vue";
import { createUid, useNestedProp } from "../lib";
import defaultConfig from "../default_config.json"

const props = defineProps({
  placedItems: {
    type: Array,
    default() {
      return []
    }
  },
  availableTypes: {
    type: Array,
    default() {
      return []
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
});

onMounted(() => {
  if(!props.availableTypes || !props.availableTypes.length) {
    console.warn(`
    Grid plan: you must provide props.availableTypes

    Example:

    [
      {
        description: "server",
        color: "#CCCCCC",
        typeId: 1
      },
      {
        description: "monitor",
        color: "#6376DD",
        typeId: 2
      }
    ]
    `)
  }
})

const emit = defineEmits([
  'change',
  'delete',
  'select',
  'unselect',
  'created',
  'selectType'
])

const items = ref([]);

const { placedItems, availableTypes, config } = toRefs(props)

function prepareItems() {
  items.value = props.placedItems.map(item => {
    const details = props.availableTypes && props.availableTypes.length ? props.availableTypes.find(t => t.typeId === item.typeId) : {}
    return {
      ...item,
      id: item.id ?? createUid(),
      ...details
    }
  });
}

onMounted(prepareItems);

watch([ placedItems, availableTypes, config ], () => {
  prepareItems();
  step.value += 1;
}, { deep: true });

const finalConfig = computed(() => {
  return useNestedProp({
    userConfig: props.config,
    defaultConfig: defaultConfig
  })
})

function recordChange(entity) {
  emit('change', entity)
}

const entity = ref({})

const step = ref(0);

function selectItem(item) {
  emit('select', item);
  entity.value = item;
  step.value += 1;
}

function triggerAction(rect) {
  items.value.push({
    ...rect,
    h: 1,
    w: 1,
    id: createUid(),
    ...activeType.value
  });
  emit('created', items.value.at(-1));
  selectItem(items.value.at(-1))
}

const activeType = ref(availableTypes.value[0])

function setActiveType(t) {
  activeType.value = t;
  emit('selectType', t)
}

function deleteItem(item) {
  emit('delete', item);
  items.value = items.value.filter(i => i.id !== item.id)
  entity.value = {}
  step.value += 1
}

function unselect() {
  emit('unselect');
  entity.value = {}
  step.value += 1
}

function getItems() {
  return items.value;
}

function focusItem(item) {
  if(entity.value.id === item.id) {
    entity.value = {}
    step.value += 1;
  } else {
    entity.value = {}
    step.value += 1;
    entity.value = item
  }
}

function getFocusState(item) {
  return item && item.id === entity.value.id
}

defineExpose({
  deleteItem,
  focusItem,
  getActiveItem: () => entity.value,
  getFocusState,
  getItems,
  selectItem,
  setActiveType,
  unselect,
})

</script>

<template>
  <main class="grid-plan-main" :style="{ position: 'relative' }">
    <slot name="before" v-bind="{ items, deleteItem, focusItem, getFocusState, activeEntity: entity }"/>

    <Grid3d
      v-if="finalConfig.grid3dPosition === 'top' && finalConfig.showGrid3d"
      :items="items" 
      :active-entity="entity"
      :config="finalConfig"
      :readonly="readonly"
      @selectItem="selectItem"
      @unselect="unselect"
    />

    <template v-if="finalConfig.showMenu">
      <details v-if="finalConfig.useAccordionMenu" class="grid-plan-menu">
        <summary class="grid-plan-menu__summary">
          {{ finalConfig.accordionMenuTitle }}
        </summary>
        <div class="grid-plan-menu__body">
          <div v-for="t in availableTypes" @click="setActiveType(t)">
            <slot name="availableType" v-bind="{ availableType: t }"/>
          </div>
        </div>
      </details>
  
      <div v-else class="grid-plan-menu">
        <div v-for="t in availableTypes" @click="setActiveType(t)">
          <slot name="availableType" v-bind="{ availableType: t }"/>
        </div>
      </div>
    </template>

    <details v-if="finalConfig.showInventory && items.length" class="grid-plan-inventory">
        <summary class="grid-plan-inventory__summary">
          {{ finalConfig.inventoryTitle }}
        </summary>
        <div class="grid-plan-inventory__body">
          <div v-for="item in items">
            <slot name="inventory" v-bind="{ item, deleteItem: () => deleteItem(item), focusItem: () => focusItem(item), isFocused: entity && entity.id === item.id }"/>
          </div>
        </div>
    </details>

    <Grid
      :readonly="readonly"
      :key="`2d_${step}`" 
      :items="items" 
      :active-entity="entity"
      :config="finalConfig"
      @change="recordChange" 
      @selectItem="selectItem"
      @triggerAction="triggerAction"
      @delete="deleteItem"
      @unselect="unselect"
    >

    <template #componentIcon="{ placedItem, maxSize, availableTypes }">
        <slot name="componentIcon" v-bind="{ placedItem, maxSize, availableTypes }"/>
    </template>

    <template #componentText="{ placedItem, availableTypes }">
      <slot name="componentText" v-bind="{ placedItem, availableTypes }"/>
    </template>
  </Grid>

  <Grid3d
    v-if="finalConfig.grid3dPosition === 'bottom' && finalConfig.showGrid3d"
    :items="items" 
    :key="`3d_${step}`"
    :active-entity="entity"
    :config="finalConfig"
    :readonly="readonly"
    @selectItem="selectItem"
    @unselect="unselect"
  />
  <slot name="after" v-bind="{ items, deleteItem, focusItem, getFocusState, activeEntity: entity }"/>
  </main>
</template>