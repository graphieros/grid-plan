import Component from "./components/GridPlan.vue";
import Menu from "./components/GridPlanMenu.vue";
import Inventory from "./components/GridPlanInventory.vue";
import type { ComponentOptionsMixin, DefineComponent } from "vue";
import type {
  GridPlanProps,
  GridPlanExpose,
  GridPlanEvents,
  GridPlanSlots,
} from "./types";
import type {
  GridPlanControlProps,
  GridPlanMenuSlotProps,
  GridPlanInventorySlotProps,
} from "./types";
import type { VNodeChild } from "vue";

// Use the stable Vue 3.3 component generics at the public entry. Inferred SFC
// declarations from newer Vue versions include additional, incompatible generic
// parameters. Props, events, slots and exposed methods share the source contracts.
type EmitOptions = {
  [K in keyof GridPlanEvents]: (...args: GridPlanEvents[K]) => void;
};
export type GridPlanComponent = DefineComponent<
  GridPlanProps,
  GridPlanExpose,
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  EmitOptions
> & { new (): { $slots: GridPlanSlots } };
export const GridPlan: GridPlanComponent = Component as GridPlanComponent;
export { defaultConfig, resolveConfig } from "./config";
export type * from "./types";

export { formatCoordinate, parseCoordinate } from "./lib/coordinates";

export { useGridPlan } from "./composables/useGridPlan";
export type GridPlanControlComponent<Scope> = DefineComponent<
  GridPlanControlProps,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  {}
> & { new (): { $slots: { default?: (scope: Scope) => VNodeChild } } };
export const GridPlanMenu: GridPlanControlComponent<GridPlanMenuSlotProps> =
  Menu as GridPlanControlComponent<GridPlanMenuSlotProps>;
export const GridPlanInventory: GridPlanControlComponent<GridPlanInventorySlotProps> =
  Inventory as GridPlanControlComponent<GridPlanInventorySlotProps>;
