import {
  computed,
  getCurrentScope,
  onScopeDispose,
  reactive,
  ref,
  toValue,
  watch,
} from "vue";
import { createUid } from "../lib";
import { canPlace } from "../lib/grid3d-edit";
import { resolveConfig } from "../config";
import { useGridCoordinates } from "./useGridCoordinates";
import type {
  GridPlanOptions,
  GridPlanEvents,
  GridPlanPlacedItem,
  GridPlanSelection,
  GridPlanItemType,
  GridPlanPoint,
  GridPlanItem,
} from "../types";

export function useGridPlan(options: GridPlanOptions = {}) {
  const placedItems = computed(() => toValue(options.placedItems) ?? []);
  const availableTypes = computed(() => toValue(options.availableTypes) ?? []);
  const config = computed(() => toValue(options.config) ?? {});
  const readonly = computed(() => toValue(options.readonly) ?? false);
  const listeners = new Map<
    keyof GridPlanEvents,
    Set<(...args: never[]) => void>
  >();
  function on<K extends keyof GridPlanEvents>(
    event: K,
    callback: (...args: GridPlanEvents[K]) => void,
  ) {
    let callbacks = listeners.get(event);
    if (!callbacks) listeners.set(event, (callbacks = new Set()));
    const listener = callback as (...args: never[]) => void;
    callbacks.add(listener);
    return () => {
      callbacks.delete(listener);
    };
  }
  function emit<K extends keyof GridPlanEvents>(
    event: K,
    ...args: GridPlanEvents[K]
  ) {
    for (const listener of [...(listeners.get(event) ?? [])])
      listener(...(args as never[]));
  }
  if (getCurrentScope()) onScopeDispose(() => listeners.clear());

  const items = ref<GridPlanPlacedItem[]>([]);

  const generatedIds = new WeakMap<GridPlanItem, string | number>();
  let previousTypes = new Map(
    availableTypes.value.map((type) => [type.typeId, { ...type }]),
  );
  function syncSelection() {
    const id = entity.value.id;
    if (id !== undefined)
      entity.value = items.value.find((item) => item.id === id) ?? {};
  }
  function prepareItems() {
    items.value = placedItems.value.map((item) => {
      const details = availableTypes.value.find(
        (type) => type.typeId === item.typeId,
      );
      const id = item.id ?? generatedIds.get(item) ?? createUid();
      generatedIds.set(item, id);
      return { ...item, id, ...details } as GridPlanPlacedItem;
    });
    syncSelection();
  }

  watch(placedItems, prepareItems, { deep: true });
  watch(
    availableTypes,
    () => {
      // A type edit refreshes existing records without reverting geometry or dropping
      // items created through the editor. Removed type fields fall back to item props.
      items.value = items.value.map((item) => {
        const original = placedItems.value.find(
          (source) => (source.id ?? generatedIds.get(source)) === item.id,
        );
        const previous = previousTypes.get(item.typeId);
        const details = availableTypes.value.find(
          (type) => type.typeId === item.typeId,
        );
        const base: GridPlanItem = { ...item };
        for (const key of Object.keys(previous ?? {})) {
          if (["id", "typeId", "x", "y", "w", "h"].includes(key)) continue;
          if (original && Object.hasOwn(original, key))
            base[key] = original[key];
          else delete base[key];
        }
        const keepDepth =
          item.depth !== undefined &&
          (original?.depth !== undefined || item.depth !== previous?.depth);
        return {
          ...base,
          ...details,
          id: item.id,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          ...(keepDepth ? { depth: item.depth } : {}),
        } as GridPlanPlacedItem;
      });
      syncSelection();
      activeType.value =
        availableTypes.value.find(
          (type) => type.typeId === activeType.value?.typeId,
        ) ?? availableTypes.value[0];
      previousTypes = new Map(
        availableTypes.value.map((type) => [type.typeId, { ...type }]),
      );
    },
    { deep: true },
  );

  const finalConfig = computed(() => resolveConfig(config.value));
  const { displayCoordinates } = useGridCoordinates(() => finalConfig.value);

  function recordChange(entity: GridPlanPlacedItem) {
    if (readonly.value) return;
    emit("change", entity);
  }

  const entity = ref<GridPlanSelection>({});
  watch(
    () => readonly.value,
    (readonly) => {
      if (readonly) entity.value = {};
    },
  );

  function selectItem(item: GridPlanPlacedItem) {
    if (readonly.value) return;
    const current = items.value.find((candidate) => candidate.id === item.id);
    if (!current) return;
    entity.value = current;
    emit("select", current);
  }

  function triggerAction(rect: GridPlanPoint) {
    if (readonly.value || !activeType.value) return;
    if (!Number.isSafeInteger(rect.x) || !Number.isSafeInteger(rect.y)) return;
    const item = {
      ...activeType.value,
      x: rect.x,
      y: rect.y,
      h: 1,
      w: 1,
      id: createUid(),
    } as GridPlanPlacedItem;
    if (!canPlace(item, items.value, finalConfig.value)) return;
    items.value.push(item);
    emit("created", item);
    selectItem(item);
  }

  const activeType = ref<GridPlanItemType | undefined>(availableTypes.value[0]);

  function setActiveType(t: GridPlanItemType) {
    if (readonly.value) return;
    const current = availableTypes.value.find(
      (type) => type.typeId === t.typeId,
    );
    if (!current) return;
    activeType.value = current;
    emit("selectType", current);
  }

  function deleteItem(item: GridPlanPlacedItem) {
    if (readonly.value) return;
    const current = items.value.find((candidate) => candidate.id === item.id);
    if (!current) return;
    items.value = items.value.filter((candidate) => candidate.id !== item.id);
    if (entity.value.id === item.id) entity.value = {};
    if (hintedId.value === item.id) hintedId.value = null;
    emit("delete", current);
  }

  function unselect() {
    if (readonly.value) return;
    entity.value = {};
    emit("unselect");
  }

  function getItems(): GridPlanPlacedItem[] {
    return items.value;
  }

  function focusItem(item: GridPlanPlacedItem) {
    if (readonly.value) return;
    if (entity.value.id === item.id) unselect();
    else selectItem(item);
  }

  const hintedId = ref<string | number | null>(null);
  const hintedItem = computed(
    () => items.value.find((item) => item.id === hintedId.value) ?? null,
  );
  function hintItem(item: GridPlanPlacedItem | null) {
    hintedId.value = item?.id ?? null;
  }

  function getFocusState(item: GridPlanItem) {
    return item.id === entity.value.id;
  }

  function getActiveItem(): GridPlanSelection {
    return entity.value;
  }

  prepareItems();

  return reactive({
    items,
    availableTypes,
    config: finalConfig,
    readonly,
    activeEntity: entity,
    activeType,
    hintedItem,
    displayCoordinates,
    createItem: triggerAction,
    recordChange,
    on,
    deleteItem,
    focusItem,
    hintItem,
    getActiveItem,
    getFocusState,
    getItems,
    selectItem,
    setActiveType,
    unselect,
  });
}
