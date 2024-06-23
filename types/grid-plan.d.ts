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
        }
    
    export type GridPlanConfig = {
        abscissaType?: "alphabetic" | "numeric"
        coordinatesBackground?: string
        coordinatesColor?: string
        crosshairBackground?: string
        fontFamily?: string
        gridFill?: string
        gridHeight?: number
        gridHighlightColor?: string
        gridStroke?: string
        gridStrokeWidth?: number
        gridWidth?: number
        handleFill?: string
        handleSize?: number
        iconColor?: string
        ordinatesType?: "alphabetic" | "numeric"
        showCrosshair?: boolean
        tooltipColor?: string
        useGradient?: boolean
        useShadow?: boolean
    }
}