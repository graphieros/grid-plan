import { computed } from 'vue';
import type { GridPlanResolvedConfig, GridPlanPlacedItem } from '../types';

function numberToLetters(num: number) {
  let letters = '';
  while (num > 0) {
    letters = String.fromCharCode(65 + (num - 1) % 26) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters;
}

export function useGridCoordinates(config: () => GridPlanResolvedConfig) {
  const gridCoordinates = computed(() => {
    const c = config();
    const axis = (size: number, alphabetic: boolean) => {
      const labels: (string | number)[] = [];
      for (let i = 1; i <= size; i++) labels.push(alphabetic ? numberToLetters(i) : i);
      return labels;
    };
    return {
      abs: axis(c.gridWidth, c.abscissaType === 'alphabetic'),
      ord: axis(c.gridHeight, c.ordinatesType === 'alphabetic'),
    };
  });

  function itemCoordinates(item: GridPlanPlacedItem | null | undefined) {
    if (!item) return '';
    const { abs, ord } = gridCoordinates.value;
    const start = `${abs[item.x]}-${ord[item.y]}`;
    return item.h === 1 && item.w === 1
      ? start
      : `${start}, ${abs[item.x + item.w - 1]}-${ord[item.y + item.h - 1]}`;
  }

  return { gridCoordinates, itemCoordinates };
}
