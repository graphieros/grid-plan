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
    if(!Object.keys(userConfig || {}).length) {
        return defaultConfig;
    }
    return treeShake({
        defaultConfig: defaultConfig,
        userConfig
    });
}

const lib = {
    createUid,
    treeShake,
    useNestedProp
}

export default lib;