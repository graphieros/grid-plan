declare module "grid-plan" {
    import { DefineComponent } from "vue";

    export const GridPlan: DefineComponent<{
        placedItems: GridPlanItem[],
        availableTypes: GridPlanItemType[],
        readonly?: boolean,
        config?: GridPlanConfig
    }>

    export type Coordinates = {
        x: number
        y: number
    }

    export type ItemSize = {
        h: number
        w: number
    }

    export type GridPlanItemType = {
        color?: string
        description: string
        icon?: string
        iconColor?: string
        typeId: string | number
    }

    export type GridPlanItem = 
        Coordinates & 
        ItemSize & 
        {
            color?: string
            description?: string
            icon?: string
            typeId: number | string
            id?: string | number
            iconColor?: string;
        }
    
    export type GridPlanConfig = {
        abscissaType?: "alphabetic" | "numeric"
        accordionMenuTitle?: string
        coordinatesBackground?: string
        coordinatesColor?: string
        crosshairBackground?: string
        fontFamily?: string
        grid3dPosition?: "top" | "bottom"
        gridFill?: string
        gridHeight?: number
        gridHighlightColor?: string
        gridStroke?: string
        gridStrokeWidth?: number
        gridWidth?: number
        handleFill?: string
        handleSize?: number
        iconColor?: string
        inventoryTitle?: string
        nonSelectedOpacity?: number
        ordinatesType?: "alphabetic" | "numeric"
        showCrosshair?: boolean
        showGrid3d?: boolean
        showInventory?: boolean
        tooltipColor?: string
        useAccorionMenu?: boolean
        useGradient?: boolean
        useShadow?: boolean
    }
}