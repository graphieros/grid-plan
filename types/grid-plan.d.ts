declare module "grid-plan" {
    import { DefineComponent } from "vue";

    type Prettify<T> = { [K in keyof T]: T[K] } & {};

    export type ItemAction<T extends GridPlanItem = GridPlanItem> =
        ((item: Readonly<T>) => void) & (() => void);

    export type ItemStateGetter<T extends GridPlanItem = GridPlanItem> =
        ((item: Readonly<T>) => boolean) & (() => boolean);

    export const GridPlan: DefineComponent<{
        placedItems: GridPlanItem[];
        availableTypes: GridPlanItemType[];
        readonly?: boolean;
        config?: GridPlanConfig;
    }>;

    export type Coordinates = {
        x?: number;
        y?: number;
    };

    export type ItemSize = {
        h?: number;
        w?: number;
        depth?: number;
    };

    export type GridPlanItemType = {
        color?: string;
        description: string;
        icon?: string;
        iconColor?: string;
        typeId: string | number;
        depth?: number;
    };

    export type GridPlanItem = Prettify<
        Coordinates &
        ItemSize & {
            color?: string;
            description?: string;
            icon?: string;
            typeId: number | string;
            id?: string | number;
            iconColor?: string;
        }
    >;

    export type GridPlanConfig = {
        abscissaType?: "alphabetic" | "numeric";
        accordionMenuTitle?: string;
        coordinatesBackground?: string;
        coordinatesColor?: string;
        crosshairBackground?: string;
        fontFamily?: string;
        grid3dPosition?: "top" | "bottom";
        gridFill?: string;
        gridHeight?: number;
        gridHighlightColor?: string;
        gridStroke?: string;
        gridStrokeWidth?: number;
        gridWidth?: number;
        handleFill?: string;
        handleSize?: number;
        iconColor?: string;
        inventoryTitle?: string;
        nonSelectedOpacity?: number;
        ordinatesType?: "alphabetic" | "numeric";
        showCrosshair?: boolean;
        showGrid3d?: boolean;
        showInventory?: boolean;
        tooltipColor?: string;
        useAccordionMenu?: boolean;
        useGradient?: boolean;
        useShadow?: boolean;
        showBox?: boolean;
        boxThickness?: number;
        boxHeight?: number;
        boxColor?: string;
    };

    /**
     * Grid Plan utility
     * ---
     * Delete an entity.
     * - Unbound: pass the item → deleteItem(item)
     * - Bound in slots: call with no args → deleteItem()
     */
    export const deleteItem: ItemAction;

    /**
     * Grid Plan utility
     * ---
     * Toggle focus on an entity.
     * - Unbound: pass the item → focusItem(item)
     * - Bound in slots: call with no args → focusItem()
     */
    export const focusItem: ItemAction;

    /**
     * Grid Plan utility
     * ---
     * Returns whether an entity is currently focused.
     * - Unbound: pass the item → getFocusState(item) => boolean
     * - Bound in slots: call with no args → getFocusState() => boolean
     */
    export const getFocusState: ItemStateGetter;
}
