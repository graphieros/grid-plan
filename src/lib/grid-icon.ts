import type { GridPlanIcon } from '../types';
import { icons } from '../icons';
import { parseSVG } from './index';

export function resolveGridIcon(icon: unknown) {
    if (!icon) return null;
    let definition: Exclude<GridPlanIcon, string | string[]>;
    if (typeof icon === 'string' && Object.hasOwn(icons, icon)) {
        definition = { paths: parseSVG(icons[icon as keyof typeof icons]).map(path => path.d) };
    } else if (typeof icon === 'string' || Array.isArray(icon)) {
        definition = { paths: icon };
    } else if (typeof icon === 'object') {
        definition = icon as Exclude<GridPlanIcon, string | string[]>;
    } else return null;

    const paths = (Array.isArray(definition.paths) ? definition.paths : [definition.paths])
        .filter(path => typeof path === 'string' && /^\s*[Mm]\s*[-+.\d]/.test(path));
    if (!paths.length) return null;
    return {
        paths,
        viewBox: definition.viewBox ?? '0 0 24 24',
        fill: definition.fill ?? 'none',
        stroke: definition.stroke ?? 'currentColor',
        strokeWidth: definition.strokeWidth ?? 1.44,
    };
}
