export function createUid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

export function treeShake({ defaultConfig, userConfig }) {
    const finalConfig = { ...defaultConfig };

    Object.keys(finalConfig).forEach(key => {
        if (Object.hasOwn(userConfig, key)) {
            const currentVal = userConfig[key]
            if (['boolean', 'function'].includes(typeof currentVal)) {
                finalConfig[key] = currentVal;
            } else if (["string", "number"].includes(typeof currentVal)) {
                if (isValidUserValue(currentVal)) {
                    finalConfig[key] = currentVal;
                }
            } else if (Array.isArray(finalConfig[key])) {
                if (checkArray({ userConfig, key })) {
                    finalConfig[key] = currentVal;
                }
            } else if (checkObj({ userConfig, key })) {
                finalConfig[key] = treeShake({
                    defaultConfig: finalConfig[key],
                    userConfig: currentVal
                });
            }
        }
    });
    return finalConfig;
}

export function isValidUserValue(val) {
    return ![null, undefined, NaN, Infinity, -Infinity].includes(val);
}

export function isSafeValue(val) {
    return ![undefined, NaN, Infinity, -Infinity].includes(val)
}

export function checkArray({ userConfig, key }) {
    return Object.hasOwn(userConfig, key) && Array.isArray(userConfig[key]) && userConfig[key].length >= 0;
}

export function checkObj({ userConfig, key }) {
    return Object.hasOwn(userConfig, key) && !Array.isArray(userConfig[key]) && typeof userConfig[key] === "object";
}

export function useNestedProp({ defaultConfig, userConfig }) {
    if (!Object.keys(userConfig || {}).length) {
        return defaultConfig;
    }
    return treeShake({
        defaultConfig: defaultConfig,
        userConfig
    });
}

export function scaleSVGPath(pathString, divisor, coordinates = { x: 10, y: 3 }) {
    if (divisor === 0) {
        throw new Error("Divisor cannot be zero.");
    }
    const commands = 'MmLlHhVvCcSsQqTtAaZz';

    let parts = pathString.split(new RegExp(`([${commands}])`, 'g')).filter(Boolean);
    let currentCommand = '';

    for (let i = 0; i < parts.length; i += 1) {
        let part = parts[i];

        if (commands.includes(part)) {
            currentCommand = part;
        } else {
            // Split coordinate pairs by spaces or commas
            let coords = part.split(/[\s,]+/).map(Number);

            if (['H', 'h'].includes(currentCommand)) {
                // Scale x coordinate for H or h commands
                for (let j = 0; j < coords.length; j += 1) {
                    coords[j] /= divisor;
                }
            } else if (['V', 'v'].includes(currentCommand)) {
                // Scale y coordinate for V or v commands
                for (let j = 0; j < coords.length; j += 1) {
                    coords[j] /= divisor;
                }
            } else if (['A', 'a'].includes(currentCommand)) {
                // Scale radii (1st and 2nd) and the x and y coordinates (5th and 6th)
                for (let j = 0; j < coords.length; j += 1) {
                    if (j % 7 === 0 || j % 7 === 1 || j % 7 === 5 || j % 7 === 6) {
                        coords[j] /= divisor;
                    }
                }
            } else {
                // Scale x and y coordinates for other commands
                for (let j = 0; j < coords.length; j += 1) {
                    coords[j] /= divisor;
                }
            }
            parts[i] = coords.join(' ');
        }
    }
    // Apply coordinates param on first pair after M
    parts = parts.map((p, i) => {
        if (i === 1) {
            const n = p.split(' ');
            return `${Number(n[0]) + coordinates.x} ${Number(n[1]) + coordinates.y}`
        }
        return p
    })

    return parts.join('');
}

export function parseSVG(svgString) {
    const pathRegex = /<path([^>]*)\/?>/g;
    let paths = [];
    let match;

    while ((match = pathRegex.exec(svgString)) !== null) {
        let attributesString = match[1].trim();
        let pathObj = {};
        let attributesRegex = /(\S+?)="([^"]*)"/g;
        let attrMatch;

        while ((attrMatch = attributesRegex.exec(attributesString)) !== null) {
            let key = attrMatch[1];
            let value = attrMatch[2];
            pathObj[key] = value;
        }

        paths.push(pathObj);
    }

    return paths;
}


const lib = {
    createUid,
    treeShake,
    useNestedProp,
    parseSVG,
    scaleSVGPath
}

export default lib;