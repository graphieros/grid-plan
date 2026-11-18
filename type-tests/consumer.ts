import {
  GridPlan,
  GridPlanMenu,
  GridPlanInventory,
  useGridPlan,
  defaultConfig,
  resolveConfig,
  formatCoordinate,
  parseCoordinate,
} from "grid-plan";
import type {
  GridPlanConfig,
  GridPlanTheme,
  GridPlanItem,
  GridPlanItemType,
  GridPlanIcon,
  GridPlanTexture,
  GridPlanPlacedItem,
  GridPlanSelection,
  GridPlanTooltipSlotProps,
  GridPlanSlots,
  GridPlanExpose,
} from "grid-plan";

type Instance = InstanceType<typeof GridPlan>;
type IsAny<T> = 0 extends 1 & T ? true : false;
type HoverScope = Parameters<NonNullable<Instance["$slots"]["tooltip"]>>[0];
type ChangeItem = Parameters<NonNullable<Instance["$props"]["onChange"]>>[0];
const scopeIsTyped: false = false as IsAny<HoverScope>;
const changeIsTyped: false = false as IsAny<ChangeItem>;
const placedItems: GridPlanItem[] = [{ typeId: 1, x: 0, y: 0, w: 1, h: 1 }];
const icon: GridPlanIcon = { paths: ["M0 0H24V24Z"], viewBox: "0 0 24 24" };
const availableTypes: GridPlanItemType[] = [
  { typeId: 1, description: "Server", icon },
];
const texture: GridPlanTexture = { src: "/texture.png", repeatX: 2 };
const config: GridPlanConfig = {
  showTooltip: true,
  tooltipPosition: "left",
  tooltipPadding: "1rem",
  tooltipWidth: "50%",
  showGrid3d: false,
};
const props: Instance["$props"] = {
  placedItems,
  availableTypes,
  config,
  onChange(item) {
    const width: number = item.w;
  },
};
const defaults: number = defaultConfig.gridWidth;
declare const instance: Instance;
const exposed: GridPlanExpose = instance;
const item: GridPlanPlacedItem = instance.getItems()[0];
const selection: GridPlanSelection = instance.getActiveItem();
instance.selectItem(item);
instance.focusItem(item);
instance.hintItem(item);
instance.hintItem(null);
instance.deleteItem(item);
instance.setActiveType(availableTypes[0]);
instance.$emit("change", item);
const scope: GridPlanTooltipSlotProps = {
  item,
  coordinates: "A-1",
  isSelected: true,
  view: "2d",
};
instance.$slots.tooltip?.(scope);
const slots: GridPlanSlots = {
  tooltip({ item, view, isSelected }) {
    return `${item.description} ${view} ${isSelected}`;
  },
};
// @ts-expect-error invalid placement must not silently become any/string
const badPosition: GridPlanConfig = { tooltipPosition: "center" };
// @ts-expect-error color must be a string
const badColor: GridPlanConfig = { tooltipColor: 123 };
// @ts-expect-error item geometry is typed in emitted payloads
instance.$emit("change", { id: "missing-geometry" });
// @ts-expect-error tooltip slot requires item information
instance.$slots.tooltip?.({ view: "2d" });
// @ts-expect-error exposed methods retain their argument types
instance.setActiveType({ description: "Missing type ID" });
// @ts-expect-error coordinates are formatted strings
const badCoordinates: number = scope.coordinates;

const theme: GridPlanTheme = "light";
const themedConfig: GridPlanConfig = resolveConfig({
  theme,
  gridFill: "#ffffff",
});
// @ts-expect-error unsupported themes are rejected
const badTheme: GridPlanConfig = { theme: "sepia" };

const formattedCoordinate: string = formatCoordinate(26, "alphabetic");
const parsedCoordinate: number = parseCoordinate("AA", "alphabetic");
// @ts-expect-error unknown coordinate formats are rejected
formatCoordinate(0, "letters");
const coordinateSlots: GridPlanSlots = {
  inventory({ item, displayCoordinates }) {
    const numericX: number = item.x;
    const label: string = displayCoordinates.x;
    return `${numericX} ${label}`;
  },
  before({ items, displayCoordinates }) {
    return items.length ? displayCoordinates(items[0]).label : "";
  },
  tooltip({ displayCoordinates, coordinates }) {
    return displayCoordinates?.label ?? coordinates;
  },
};

const controller = useGridPlan({ placedItems, availableTypes, config });
const controllerItems: GridPlanPlacedItem[] = controller.items;
const controllerSelection: GridPlanSelection = controller.activeEntity;
controller.on("change", (changed) => {
  const width: number = changed.w;
});
controller.on("unselect", () => {});
// @ts-expect-error unknown controller events are rejected
controller.on("unknown", () => {});
// @ts-expect-error invalid event payload types are rejected
controller.on("change", (changed: string) => {});
const sharedProps: Instance["$props"] = { plan: controller };
const menuProps: InstanceType<typeof GridPlanMenu>["$props"] = {
  plan: controller,
  accordion: false,
};
const inventoryProps: InstanceType<typeof GridPlanInventory>["$props"] = {
  plan: controller,
};
// @ts-expect-error standalone controls require a controller
const badMenuProps: InstanceType<typeof GridPlanMenu>["$props"] = {};
