<script setup >
import { ref, computed, onMounted } from "vue"
import Grid from "./Grid.vue";
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
  'created'
])

const items = ref(props.placedItems.map(item => {
  const details = props.availableTypes && props.availableTypes.length ? props.availableTypes.find(t => t.typeId === item.typeId) : {}
  return {
    ...item,
    id: item.id ?? createUid(),
    ...details
  }
}))

const finalConfig = computed(() => {
  return useNestedProp({
    userConfig: props.config,
    defaultConfig: defaultConfig
  })
})

function recordChange(entity) {
  emit('change', entity)
}

const entity = ref({
})

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

const availableTypes = ref(props.availableTypes)

const activeType = ref(availableTypes.value[0])

function setActiveType(t) {
  activeType.value = t;
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

defineExpose({
  getItems
})

</script>

<template>
  <main>
    <div class="flex flex-row gap-6 p-8">
      <div v-for="t in availableTypes" @click="setActiveType(t)">
        <slot name="availableType" v-bind="{ availableType: t }"/>
      </div>
    </div>
    <Grid
      :readonly="readonly"
      :key="step" 
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
        <slot name="componentIcon" v-bind="{ placedItem, maxSize }"/>
    </template>

    <template #componentText="{ placedItem, availableTypes }">
      <slot name="componentText" v-bind="{ placedItem }"/>
    </template>
  </Grid>
  </main>
</template>