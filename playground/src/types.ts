import type { GridPlanExpose, GridPlanResolvedConfig } from "grid-plan";
export type ConfigKey = keyof GridPlanResolvedConfig;
export type ConfigValue = GridPlanResolvedConfig[ConfigKey];
export type ViewMode = "2d" | "3d" | "both" | "none";
export interface PlaygroundEvent {
  id: number;
  name: string;
  time: string;
  detail: string;
}
export interface SettingsGroup {
  title: string;
  hint: string;
  keys: ConfigKey[];
}
export interface NumericConstraint {
  min: number;
  max: number;
  step: number;
}
export type PlanPreviewExpose = Pick<
  GridPlanExpose,
  "setActiveType" | "unselect"
>;
