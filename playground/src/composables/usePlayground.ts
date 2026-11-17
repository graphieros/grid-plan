import type { GridPlanResolvedConfig, GridPlanPlacedItem, GridPlanItemType, GridPlanItem } from 'grid-plan';
import type { ConfigKey, ViewMode, PlaygroundEvent, PlanPreviewExpose } from '../types';
import { computed, ref, watch } from 'vue';
import { defaultConfig, resolveConfig } from 'grid-plan';
import { baseTypes, createSampleItems } from '../data/items';

export function usePlayground() {
  const config = ref<GridPlanResolvedConfig>({ ...defaultConfig });
  const readonly = ref(false);
  const showLabels = ref(false);
  const showCustomTooltip = ref(false);
  const useIconLibrary = ref(false);
  const plan = ref<PlanPreviewExpose | null>(null);
  const activeType = ref<string | number>(3);
  const selected = ref<GridPlanPlacedItem | null>(null);
  const events = ref<PlaygroundEvent[]>([]);
  const items = ref(createSampleItems(config.value));
  let eventId = 0;

  const types = computed(() => baseTypes.map(type => ({
    ...type, icon: useIconLibrary.value ? undefined : type.icon,
  })));
  const changedCount = computed(() => {
    const baseline = resolveConfig({ theme: config.value.theme });
    return (Object.keys(defaultConfig) as ConfigKey[]).filter(key =>
      config.value[key] !== (key === 'theme' ? defaultConfig[key] : baseline[key])).length;
  });
  const outsideCount = computed(() => items.value.filter(item =>
    item.x + item.w > config.value.gridWidth || item.y + item.h > config.value.gridHeight).length);
  const view = computed(() => config.value.showGrid2d && config.value.showGrid3d ? 'both'
    : config.value.showGrid2d ? '2d' : config.value.showGrid3d ? '3d' : 'none');

  function log(name: string, item?: GridPlanItem | GridPlanItemType) {
    events.value = [{ id: ++eventId, name, time: new Date().toLocaleTimeString(),
      detail: item ? JSON.stringify(item) : 'Selection cleared' }, ...events.value].slice(0, 30);
  }
  function saveItem(name: string, item: GridPlanPlacedItem) {
    const saved = JSON.parse(JSON.stringify(item)) as GridPlanPlacedItem;
    items.value = items.value.some(existing => existing.id === item.id)
      ? items.value.map(existing => existing.id === item.id ? saved : existing)
      : [...items.value, saved];
    selected.value = saved;
    log(name, saved);
  }
  function removeItem(item: GridPlanPlacedItem) {
    items.value = items.value.filter(existing => existing.id !== item.id);
    selected.value = null;
    log('delete', item);
  }
  function selectItem(item: GridPlanPlacedItem) { selected.value = item; log('select', item); }
  function unselect() { selected.value = null; log('unselect'); }
  function chooseType(type: GridPlanItemType | undefined) {
    if (!type) return;
    activeType.value = type.typeId;
    plan.value?.setActiveType(type);
  }
  function selectType(type: GridPlanItemType) { activeType.value = type.typeId; log('selectType', type); }
  function setView(mode: Exclude<ViewMode, 'none'>) {
    config.value = { ...config.value, showGrid2d: mode !== '3d', showGrid3d: mode !== '2d' };
  }
  function resetItems(empty = false) {
    plan.value?.unselect();
    selected.value = null;
    items.value = empty ? [] : createSampleItems(config.value);
    log(empty ? 'clear items' : 'load sample');
  }
  function resetConfig() {
    config.value = { ...defaultConfig };
    readonly.value = false;
    showLabels.value = false;
    showCustomTooltip.value = false;
    useIconLibrary.value = false;
  }
  watch(useIconLibrary, () => {
    plan.value?.unselect();
    selected.value = null;
    chooseType(types.value.find(type => type.typeId === activeType.value));
  });

  return { config, readonly, showLabels, showCustomTooltip, useIconLibrary, plan, activeType, selected, events, items, types,
    changedCount, outsideCount, view, saveItem, removeItem, selectItem, unselect, chooseType, selectType,
    setView, resetItems, resetConfig };
}
