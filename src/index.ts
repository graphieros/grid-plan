import Component from './components/GridPlan.vue';
import type { ComponentOptionsMixin, DefineComponent } from 'vue';
import type { GridPlanProps, GridPlanExpose, GridPlanEvents, GridPlanSlots } from './types';

// Use the stable Vue 3.3 component generics at the public entry. Inferred SFC
// declarations from newer Vue versions include additional, incompatible generic
// parameters. Props, events, slots and exposed methods share the source contracts.
type EmitOptions = { [K in keyof GridPlanEvents]: (...args: GridPlanEvents[K]) => void };
export type GridPlanComponent = DefineComponent<GridPlanProps, GridPlanExpose, {}, {}, {},
  ComponentOptionsMixin, ComponentOptionsMixin, EmitOptions> & { new(): { $slots: GridPlanSlots } };
export const GridPlan: GridPlanComponent = Component as GridPlanComponent;
export { defaultConfig, resolveConfig } from './config';
export type * from './types';
