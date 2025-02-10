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

/**
 * Grid Plan utility
 * ---
 * Delete an entity
 * ---
 * 1. Usage in #inventory slot:
 * 
 * @example
 * ```vue
 * <template #inventory="{ item, deleteItem, focusItem, isFocused }">
 *   <div :style="`display: flex; flex-direction: row; flex-wrap: wrap; 
 *        border: 1px solid ${item.color}; width: fit-content; 
 *        padding: 6px 12px; gap: 6px; 
 *        ${isFocused ? 'background: #FFFFFF20' : ''}`">
 *     <span>{{ item.description }}</span>
 *     <span>x: {{ item.x }}</span>
 *     <span>y: {{ item.y }}</span>
 *     <span>h: {{ item.h }}</span>
 *     <span>w: {{ item.w }}</span>
 *     <button @ click="deleteItem">DELETE</button>
 *     <button @ click="focusItem">{{ isFocused ? 'UNFOCUS' : 'FOCUS' }}</button>
 *   </div>
 * </template>
 * ```
 * 
 * 2. Usage in #before and #after slots:
 * 
 * @example
 * ```vue
 * <template #before="{ items, deleteItem, focusItem, getFocusState, activeEntity }">
 *      <div>
 *          ACTIVE ENTITY: {{ activeEntity }}
 *      </div>
 *      <div v-for="item in items">
 *          {{ item.description }}
 *          <button @ click="deleteItem(item)">DELETE</button>
 *          <button @ click="focusItem(item)">DELETE</button>
 *          FOCUS STATE: {{ getFocusState(item) }}
 *      </div>
 * </template>
 * ```
 * 
 * @param {Object} item - GridPlanItem
 */
export const deleteItem: (item: GridPlanItem) => void


/**
 * Grid Plan utility
 * ---
 * Toggle focus on an entity.
 * ---
 * @param {Object} item - GridPlanItem
 */
export const focusItem: (item: GridPlanItem) => void

/**
 * Grid Plan utility
 * ---
 * Returns the focus state of an entity: true if the entity is currently focused.
 * ---
 * @param {Object} item - GridPlanItem
 */
export const getFocusState: (item: GridPlanItem) => boolean