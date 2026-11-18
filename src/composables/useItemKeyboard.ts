import { computed, ref, watch } from "vue";
import type { GridPlanPlacedItem, GridPlanSelection } from "../types";

export function useItemKeyboard(options: {
  items: () => GridPlanPlacedItem[];
  selected: () => GridPlanSelection;
  readonly: () => boolean;
  select: (item: GridPlanPlacedItem) => void;
  unselect: () => void;
}) {
  const focusedId = ref<string | number>();
  const focusedItem = computed(
    () => options.items().find((item) => item.id === focusedId.value) ?? null,
  );
  function clearKeyboardFocus() {
    focusedId.value = undefined;
  }
  watch(
    () => options.items().map((item) => item.id),
    (ids) => {
      if (focusedId.value !== undefined && !ids.includes(focusedId.value))
        clearKeyboardFocus();
    },
  );
  function onKeyDown(event: KeyboardEvent) {
    const target = event.target;
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      (target instanceof Element &&
        target.closest(
          'input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"])',
        ))
    )
      return;
    const direction = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    }[event.key];
    if (direction) {
      const items = options.items();
      if (!items.length) return;
      event.preventDefault();
      const index = items.findIndex(
        (item) => item.id === (focusedId.value ?? options.selected().id),
      );
      const next =
        index < 0
          ? direction > 0
            ? 0
            : items.length - 1
          : (index + direction + items.length) % items.length;
      focusedId.value = items[next].id;
    } else if (
      !options.readonly() &&
      event.key === "Enter" &&
      focusedItem.value
    ) {
      event.preventDefault();
      options.select(focusedItem.value);
    } else if (!options.readonly() && event.key === "Escape") {
      event.preventDefault();
      clearKeyboardFocus();
      options.unselect();
    }
  }
  return { focusedItem, clearKeyboardFocus, onKeyDown };
}
