declare module "grid-plan" {
    import { DefineComponent } from "vue";

    type Prettify<T> = { [K in keyof T]: T[K] } & {};

    export type ItemAction<T extends GridPlanItem = GridPlanItem> =
        ((item: Readonly<T>) => void) & (() => void);

    export type ItemStateGetter<T extends GridPlanItem = GridPlanItem> =
        ((item: Readonly<T>) => boolean) & (() => boolean);

    export type GridPlanTooltipSlotProps<T extends GridPlanItem = GridPlanItem> = {
        item: T;
        isSelected: boolean;
        coordinates: string;
        view: "2d" | "3d";
    };

    export type GridPlanExpose = {
        deleteItem(item: GridPlanItem): void
        focusItem(item: GridPlanItem): void
        getActiveItem(): GridPlanItem
        getFocusState(item: GridPlanItem): boolean
        getItems(): GridPlanItem[]
        selectItem(item: GridPlanItem): void
        setActiveType(t: GridPlanItemType): void
        unselect(): void
    }

    export const GridPlan: DefineComponent<{
        placedItems: GridPlanItem[];
        availableTypes: GridPlanItemType[];
        readonly?: boolean;
        config?: GridPlanConfig;
    }, GridPlanExpose>;

    export const defaultConfig: Required<GridPlanConfig>;

    export type Coordinates = {
        x?: number;
        y?: number;
    };

    export type ItemSize = {
        h?: number;
        w?: number;
        depth?: number;
    };

    /** Built-in icon name, SVG path data (24×24), or a custom SVG definition. */
    export type GridPlanIcon = string | string[] | {
        paths: string | string[];
        viewBox?: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
    };

    export type GridPlanItemType = {
        color?: string;
        description: string;
        icon?: GridPlanIcon;
        iconColor?: string;
        typeId: string | number;
        depth?: number;
    };

    export type GridPlanTexture = {
        src: string; 
        repeatX?: number; 
        repeatY?: number; 
        rotation?: number; 
        metalness?: number; 
        roughness?: number;
    }

    export type GridPlanItem = Prettify<
        Coordinates &
        ItemSize & {
            color?: string;
            description?: string;
            icon?: GridPlanIcon;
            typeId: number | string;
            id?: string | number;
            iconColor?: string;
            texture?: GridPlanTexture;
        }
    >;

    export type GridPlanConfig = {
        abscissaType?: "alphabetic" | "numeric";
        accordionMenuTitle?: string;
        coordinatesBackground?: string;
        coordinatesColor?: string;
        crosshairBackground?: string;
        fontFamily?: string;
        /** 2D item label font size, in grid units. */
        itemNameFontSizeRatio?: number;
        /** 2D item coordinate font size, in grid units. */
        itemCoordinatesFontSizeRatio?: number;
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
        showIcons?: boolean;
        showGrid3d?: boolean;
        showGrid2d?: boolean;
        showInventory?: boolean;
        tooltipColor?: string;
        tooltipBackgroundColor?: string;
        tooltipBorderRadius?: number | string;
        tooltipLineHeight?: number | string;
        tooltipPadding?: number | string;
        tooltipBorder?: string;
        tooltipBoxShadow?: string;
        tooltipWidth?: number | string;
        tooltipMaxWidth?: number | string;
        tooltipMaxHeight?: number | string;
        showTooltip?: boolean;
        tooltipPosition?: "top" | "bottom" | "left" | "right";
        useAccordionMenu?: boolean;
        useGradient?: boolean;
        useShadow?: boolean;
        showBox?: boolean;
        boxThickness?: number;
        boxHeight?: number;
        boxColor?: string;
        showMenu?: boolean;
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
