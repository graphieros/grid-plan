import { describe, test, expect } from 'vitest'
import * as LIB from '../../lib';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-adjustments-dollar" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
<path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
<path d="M6 4v4" />
<path d="M6 12v8" />
<path d="M13.366 14.54a2 2 0 1 0 -.216 3.097" />
</svg>
`
const parsed = LIB.parseSVG(svg);

describe('parseSVG', () => {
    test('parses a svg icon', () => {
        expect(parsed).toStrictEqual([
            {
                "d": "M0 0h24v24H0z",
                "fill": "none",
                "stroke": "none",
            },
            {
                "d": "M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0",
            },
            {
                "d": "M6 4v4",
            },
            {
                "d": "M6 12v8",
            },
            {
                "d": "M13.366 14.54a2 2 0 1 0 -.216 3.097",
            },
        ])
    })
})

describe('scaleSVGPath', () => {
    const scaled0 = parsed[0]
    const scaled1 = parsed[1]
    const scaled2 = parsed[2]
    const scaled3 = parsed[3]
    const scaled4 = parsed[4]
    test('resized and places svg on shifted coordinates', () => {
        expect(LIB.scaleSVGPath(scaled0.d, 24, {x: 0, y: 11})).toStrictEqual("M0 11h1v1H0z")
        expect(LIB.scaleSVGPath(scaled1.d, 24, {x: 2, y: 3})).toStrictEqual("M2.1666666666666665 3.4166666666666665a0.08333333333333333 0.08333333333333333 0 1 0 0.16666666666666666 0a0.08333333333333333 0.08333333333333333 0 0 0 -0.16666666666666666 0")
        expect(LIB.scaleSVGPath(scaled2.d, 24, {x: 5, y: 4})).toStrictEqual("M5.25 4.166666666666667v0.16666666666666666")
        expect(LIB.scaleSVGPath(scaled3.d, 24, {x: 5, y: 4})).toStrictEqual("M5.25 4.5v0.3333333333333333")
        expect(LIB.scaleSVGPath(scaled4.d, 24, {x: 5, y: 4})).toStrictEqual("M5.556916666666667 4.605833333333333a0.08333333333333333 0.08333333333333333 0 1 0 -0.009 0.12904166666666667")
    })
})

describe("convertColorToHex", () => {
    test("returns HEX color format from RGB", () => {
        expect(LIB.convertColorToHex("rgb(255,0,0)")).toBe("#ff0000ff");
        expect(LIB.convertColorToHex("rgb(0,255,0)")).toBe("#00ff00ff");
        expect(LIB.convertColorToHex("rgb(0,0,255)")).toBe("#0000ffff");
        expect(LIB.convertColorToHex("rgb(0,0,0)")).toBe("#000000ff");
        expect(LIB.convertColorToHex("rgb(255,255,255)")).toBe("#ffffffff");
    });

    test("returns HEX color format from HSL", () => {
        expect(LIB.convertColorToHex("hsl(0,100%,50%)")).toBe("#ff0000ff");
        expect(LIB.convertColorToHex("hsl(120,100%,50%)")).toBe("#00ff00ff");
        expect(LIB.convertColorToHex("hsl(240,100%,50%)")).toBe("#0000ffff");
        expect(LIB.convertColorToHex("hsl(0,0%,0%)")).toBe("#000000ff");
        expect(LIB.convertColorToHex("hsl(0,0%,100%)")).toBe("#ffffffff");
    });

    test("returns HEX color from an HSL passed through hslToRgba", () => {
        const rgb = LIB.hslToRgba(50, 50, 50);
        expect(LIB.convertColorToHex(`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`)).toBe(
            "#bfaa40ff"
        );
    });

    test("returns HEX color from a name color", () => {
        expect(LIB.convertColorToHex("red")).toBe("#FF0000ff");
        expect(LIB.convertColorToHex("RED")).toBe("#FF0000ff");
        expect(LIB.convertColorToHex("Red")).toBe("#FF0000ff");
    });

    test("should convert rgba to hex with alpha channel", () => {
        const result = LIB.convertColorToHex("rgba(255,0,0,0.5)");
        expect(result).toBe("#ff000080");
    });

    test("should convert hsla to hex with alpha channel", () => {
        const result = LIB.convertColorToHex("hsla(0, 100%, 50%, 0.5)");
        expect(result).toBe("#ff000080");
    });
});

describe("hslToRgba", () => {
    test("converts hsl to RGBA", () => {
        expect(LIB.hslToRgba(50, 50, 50)).toStrictEqual([191, 170, 64, 1]);
    });
    test("converts hsla to RGBA", () => {
        expect(LIB.hslToRgba(50, 50, 50, 0.5)).toStrictEqual([191, 170, 64, 0.5]);
    });
});

describe("convertNameColorToHex", () => {
    test("returns a hex color from a standard html color name", () => {
        expect(LIB.convertNameColorToHex("red")).toBe("#FF0000");
        expect(LIB.convertNameColorToHex("Red")).toBe("#FF0000");
        expect(LIB.convertNameColorToHex("RED")).toBe("#FF0000");
        expect(LIB.convertNameColorToHex("sandybrown")).toBe("#F4A460");
        expect(LIB.convertNameColorToHex("SandyBrown")).toBe("#F4A460");
        expect(LIB.convertNameColorToHex("SANDYBROWN")).toBe("#F4A460");
    });
});