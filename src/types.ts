import type { VNodeChild } from 'vue';
import type { GridPlanConfig, GridPlanResolvedConfig } from './config';
export type { GridPlanConfig, GridPlanResolvedConfig, GridPlanCoordinateType, GridPlanTooltipPosition, GridPlanTheme } from './config';

export type Coordinates = { x?: number; y?: number };
export type ItemSize = { w?: number; h?: number; depth?: number };
export type GridPlanIcon = string | string[] | {
  paths: string | string[];
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};
export interface GridPlanTexture {
  src: string;
  repeatX?: number;
  repeatY?: number;
  rotation?: number;
  metalness?: number;
  roughness?: number;
}
export interface GridPlanItemType {
  typeId: string | number;
  description: string;
  color?: string;
  icon?: GridPlanIcon;
  iconColor?: string;
  depth?: number;
  [key: string]: unknown;
}
export interface GridPlanItem extends Coordinates, ItemSize {
  typeId: string | number;
  id?: string | number;
  color?: string;
  description?: string;
  icon?: GridPlanIcon;
  iconColor?: string;
  texture?: GridPlanTexture;
  [key: string]: unknown;
}
export type GridPlanFootprint = { x: number; y: number; w: number; h: number };
export type GridPlanPlacedItem = GridPlanItem & GridPlanFootprint & { id: string | number };
export type GridPlanSelection = GridPlanPlacedItem | {
  id?: undefined; typeId?: undefined; x?: undefined; y?: undefined; w?: undefined; h?: undefined;
  depth?: undefined; description?: undefined; color?: undefined; icon?: undefined;
  iconColor?: undefined; texture?: undefined;
};
export interface GridPlanProps {
  placedItems?: GridPlanItem[];
  availableTypes?: GridPlanItemType[];
  config?: GridPlanConfig;
  readonly?: boolean;
}
export interface GridViewProps {
  items?: GridPlanPlacedItem[];
  activeEntity?: GridPlanSelection;
  config: GridPlanResolvedConfig;
  readonly?: boolean;
}
export interface GridPlanExpose {
  deleteItem(item: GridPlanPlacedItem): void;
  focusItem(item: GridPlanPlacedItem): void;
  getActiveItem(): GridPlanSelection;
  getFocusState(item: GridPlanItem): boolean;
  getItems(): GridPlanPlacedItem[];
  selectItem(item: GridPlanPlacedItem): void;
  setActiveType(type: GridPlanItemType): void;
  unselect(): void;
}
export type ItemAction<T extends GridPlanItem = GridPlanItem> = ((item: Readonly<T>) => void) & (() => void);
export type ItemStateGetter<T extends GridPlanItem = GridPlanItem> = ((item: Readonly<T>) => boolean) & (() => boolean);
export interface GridPlanTooltipSlotProps<T extends GridPlanItem = GridPlanPlacedItem> {
  item: T;
  coordinates: string;
  isSelected: boolean;
  view: '2d' | '3d';
}
export type GridPlanEvents = {
  change: [item: GridPlanPlacedItem]; delete: [item: GridPlanPlacedItem];
  select: [item: GridPlanPlacedItem]; unselect: []; created: [item: GridPlanPlacedItem];
  selectType: [type: GridPlanItemType];
};
export type GridViewEvents = {
  change: [item: GridPlanPlacedItem]; selectItem: [item: GridPlanPlacedItem];
  triggerAction: [point: GridPlanPoint]; delete: [item: GridPlanPlacedItem]; unselect: [];
  hoverSquare: [point: GridPlanPoint]; hoverItem: [item: GridPlanPlacedItem];
};
export type GridPlanPoint = { x: number; y: number };
export type GridPlanResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type GridPlanPointerEvent = MouseEvent | TouchEvent;
export interface GridPlanIconSlotProps { placedItem: GridPlanPlacedItem; maxSize: number; iconColor: string }
export interface GridPlanBeforeSlotProps {
  items: GridPlanPlacedItem[]; deleteItem: GridPlanExpose['deleteItem']; focusItem: GridPlanExpose['focusItem'];
  getFocusState: GridPlanExpose['getFocusState']; activeEntity: GridPlanSelection;
}
export interface GridPlanSlots {
  before?: (scope: GridPlanBeforeSlotProps) => VNodeChild;
  after?: (scope: GridPlanBeforeSlotProps) => VNodeChild;
  availableType?: (scope: { availableType: GridPlanItemType }) => VNodeChild;
  inventory?: (scope: { item: GridPlanPlacedItem; deleteItem: () => void; focusItem: () => void; isFocused: boolean }) => VNodeChild;
  componentIcon?: (scope: GridPlanIconSlotProps) => VNodeChild;
  componentText?: (scope: { placedItem: GridPlanPlacedItem; iconColor: string }) => VNodeChild;
  deleteIcon?: (scope: { item: GridPlanPlacedItem }) => VNodeChild;
  tooltip?: (scope: GridPlanTooltipSlotProps) => VNodeChild;
}
export type GridViewSlots = Pick<GridPlanSlots, 'componentIcon' | 'componentText' | 'deleteIcon' | 'tooltip'>;
export function isPlacedItem(value: unknown): value is GridPlanPlacedItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GridPlanPlacedItem>;
  return typeof item.x === 'number' && typeof item.y === 'number' && typeof item.w === 'number' && typeof item.h === 'number';
}
