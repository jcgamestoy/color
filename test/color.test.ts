import { describe, expect, test } from 'bun:test'
import { Color, MutableColor } from '../src/color'

const approx = (a: number, b: number, eps = 0.001) => Math.abs(a - b) < eps

describe('Color constructor', () => {
  test('from RGB components', () => {
    const c = new Color(1, 0.5, 0.25, 1)
    expect(c.r).toBe(1)
    expect(c.g).toBe(0.5)
    expect(c.b).toBe(0.25)
    expect(c.a).toBe(1)
  })

  test('from RGB components without alpha defaults to 1', () => {
    const c = new Color(1, 0, 0, 1)
    expect(c.a).toBe(1)
  })

  test('from hex string #RRGGBB', () => {
    const c = new Color('#ff8040')
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.g, 0.502, 0.01)).toBe(true)
    expect(approx(c.b, 0.251, 0.01)).toBe(true)
    expect(c.a).toBe(1)
  })

  test('from hex string #RRGGBBAA', () => {
    const c = new Color('#ff804080')
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.a, 0.502, 0.01)).toBe(true)
  })

  test('from hex string without #', () => {
    const c = new Color('ff0000')
    expect(approx(c.r, 1)).toBe(true)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
  })

  test('from short hex string #RGB', () => {
    const c = new Color('#f80')
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.g, 0.533, 0.01)).toBe(true)
    expect(c.b).toBe(0)
  })

  test('from short hex string #RGBA', () => {
    const c = new Color('#f80f')
    expect(c.a).toBe(1)
  })

  test('from integer 0xAABBGGRR', () => {
    const c = new Color(0xff0000ff)
    expect(approx(c.r, 1)).toBe(true)
    expect(c.g).toBe(0)
    expect(c.b).toBe(0)
    expect(approx(c.a, 1)).toBe(true)
  })

  test('from integer with alpha', () => {
    const c = new Color(0x800000ff)
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.a, 0.502, 0.01)).toBe(true)
  })

  test('throws on invalid string', () => {
    expect(() => new Color('not-a-color')).toThrow('Invalid color string')
  })

  test('throws on invalid arguments', () => {
    // @ts-ignore
    expect(() => new Color(undefined)).toThrow()
  })
})

describe('Color getters', () => {
  test('r, g, b, a', () => {
    const c = new Color(0.1, 0.2, 0.3, 0.4)
    expect(c.r).toBe(0.1)
    expect(c.g).toBe(0.2)
    expect(c.b).toBe(0.3)
    expect(c.a).toBe(0.4)
  })

  test('h for red', () => {
    const c = new Color(1, 0, 0, 1)
    expect(approx(c.h, 0)).toBe(true)
  })

  test('h for green', () => {
    const c = new Color(0, 1, 0, 1)
    expect(approx(c.h, 1 / 3, 0.01)).toBe(true)
  })

  test('h for blue', () => {
    const c = new Color(0, 0, 1, 1)
    expect(approx(c.h, 2 / 3, 0.01)).toBe(true)
  })

  test('h for gray (achromatic) is 0', () => {
    const c = new Color(0.5, 0.5, 0.5, 1)
    expect(c.h).toBe(0)
  })

  test('s for pure red is 1', () => {
    const c = new Color(1, 0, 0, 1)
    expect(c.s).toBe(1)
  })

  test('s for gray is 0', () => {
    const c = new Color(0.5, 0.5, 0.5, 1)
    expect(c.s).toBe(0)
  })

  test('s for black is 0', () => {
    const c = new Color(0, 0, 0, 1)
    expect(c.s).toBe(0)
  })

  test('v for pure red is 1', () => {
    const c = new Color(1, 0, 0, 1)
    expect(c.v).toBe(1)
  })

  test('v for black is 0', () => {
    const c = new Color(0, 0, 0, 1)
    expect(c.v).toBe(0)
  })

  test('v is max of r, g, b', () => {
    const c = new Color(0.2, 0.8, 0.5, 1)
    expect(c.v).toBe(0.8)
  })
})

describe('Color.add', () => {
  test('adds components', () => {
    const a = new Color(0.1, 0.2, 0.3, 0.5)
    const b = new Color(0.1, 0.1, 0.1, 0.1)
    const result = a.add(b)
    expect(approx(result.r, 0.2)).toBe(true)
    expect(approx(result.g, 0.3)).toBe(true)
    expect(approx(result.b, 0.4)).toBe(true)
    expect(approx(result.a, 0.6)).toBe(true)
  })

  test('returns a new Color instance', () => {
    const a = new Color(0.5, 0.5, 0.5, 1)
    const b = new Color(0.1, 0.1, 0.1, 0)
    expect(a.add(b)).not.toBe(a)
  })
})

describe('Color.sub', () => {
  test('subtracts components', () => {
    const a = new Color(0.5, 0.6, 0.7, 1)
    const b = new Color(0.1, 0.1, 0.2, 0.5)
    const result = a.sub(b)
    expect(approx(result.r, 0.4)).toBe(true)
    expect(approx(result.g, 0.5)).toBe(true)
    expect(approx(result.b, 0.5)).toBe(true)
    expect(approx(result.a, 0.5)).toBe(true)
  })
})

describe('Color.mul', () => {
  test('multiplies by scalar', () => {
    const c = new Color(0.5, 0.4, 0.2, 1)
    const result = c.mul(2)
    expect(approx(result.r, 1)).toBe(true)
    expect(approx(result.g, 0.8)).toBe(true)
    expect(approx(result.b, 0.4)).toBe(true)
    expect(approx(result.a, 2)).toBe(true)
  })

  test('mul by 0 gives black transparent', () => {
    const c = new Color(1, 1, 1, 1)
    const result = c.mul(0)
    expect(result.r).toBe(0)
    expect(result.g).toBe(0)
    expect(result.b).toBe(0)
    expect(result.a).toBe(0)
  })
})

describe('Color.div', () => {
  test('divides by scalar', () => {
    const c = new Color(1, 0.8, 0.4, 1)
    const result = c.div(2)
    expect(approx(result.r, 0.5)).toBe(true)
    expect(approx(result.g, 0.4)).toBe(true)
    expect(approx(result.b, 0.2)).toBe(true)
    expect(approx(result.a, 0.5)).toBe(true)
  })
})

describe('Color.interpolate', () => {
  test('t=0 returns copy of self', () => {
    const a = new Color(1, 0, 0, 1)
    const b = new Color(0, 0, 1, 1)
    const result = a.interpolate(b, 0)
    expect(approx(result.r, 1)).toBe(true)
    expect(approx(result.b, 0)).toBe(true)
  })

  test('t=1 returns copy of target', () => {
    const a = new Color(1, 0, 0, 1)
    const b = new Color(0, 0, 1, 1)
    const result = a.interpolate(b, 1)
    expect(approx(result.r, 0)).toBe(true)
    expect(approx(result.b, 1)).toBe(true)
  })

  test('t=0.5 gives midpoint', () => {
    const a = new Color(0, 0, 0, 0)
    const b = new Color(1, 1, 1, 1)
    const result = a.interpolate(b, 0.5)
    expect(approx(result.r, 0.5)).toBe(true)
    expect(approx(result.a, 0.5)).toBe(true)
  })

  test('returns new Color, does not mutate', () => {
    const a = new Color(1, 0, 0, 1)
    const b = new Color(0, 1, 0, 1)
    const result = a.interpolate(b, 0.5)
    expect(result).not.toBe(a)
    expect(a.r).toBe(1)
  })
})

describe('Color.interpolateIn', () => {
  test('mutates current color', () => {
    const a = new Color(0, 0, 0, 0)
    const b = new Color(1, 1, 1, 1)
    const returned = a.interpolateIn(b, 0.5)
    expect(returned).toBe(a)
    expect(approx(a.r, 0.5)).toBe(true)
  })

  test('invalidates HSV cache after mutation', () => {
    const a = new Color(1, 0, 0, 1)
    const _ = a.h
    a.interpolateIn(new Color(0, 1, 0, 1), 1)
    expect(approx(a.h, 1 / 3, 0.01)).toBe(true)
  })
})

describe('Color.toString', () => {
  test('returns hex string with alpha', () => {
    expect(Color.red.toString()).toBe('#ff0000ff')
  })

  test('black', () => {
    expect(Color.black.toString()).toBe('#000000ff')
  })

  test('white', () => {
    expect(Color.white.toString()).toBe('#ffffffff')
  })

  test('transparent', () => {
    expect(Color.transparent.toString()).toBe('#00000000')
  })
})

describe('Color.toRGBA', () => {
  test('red is 0xff0000ff', () => {
    expect(Color.red.toRGBA()).toBe(0xff0000ff)
  })

  test('black is 0xff000000', () => {
    expect(Color.black.toRGBA()).toBe(0xff000000)
  })

  test('white is 0xffffffff', () => {
    expect(Color.white.toRGBA()).toBe(0xffffffff)
  })

  test('transparent is 0x00000000', () => {
    expect(Color.transparent.toRGBA()).toBe(0x00000000)
  })

  test('roundtrip with integer constructor', () => {
    const original = 0x4080c0ff
    const c = new Color(original)
    expect(c.toRGBA()).toBe(original)
  })

  test('returns unsigned number', () => {
    expect(Color.red.toRGBA()).toBeGreaterThan(0)
  })
})

describe('Color.toAnsiRGB', () => {
  test('returns ANSI foreground escape sequence', () => {
    const c = new Color(1, 0, 0, 1)
    expect(c.toAnsiRGB()).toBe('\x1b[38;2;255;0;0m')
  })

  test('caches result', () => {
    const c = new Color(0, 1, 0, 1)
    expect(c.toAnsiRGB()).toBe(c.toAnsiRGB())
  })
})

describe('Color.toAnsiBackgroundRGB', () => {
  test('returns ANSI background escape sequence', () => {
    const c = new Color(0, 0, 1, 1)
    expect(c.toAnsiBackgroundRGB()).toBe('\x1b[48;2;0;0;255m')
  })

  test('caches result', () => {
    const c = new Color(1, 1, 0, 1)
    expect(c.toAnsiBackgroundRGB()).toBe(c.toAnsiBackgroundRGB())
  })
})

describe('Color.fromHSV', () => {
  test('red: h=0, s=1, v=1', () => {
    const c = Color.fromHSV(0, 1, 1)
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.g, 0)).toBe(true)
    expect(approx(c.b, 0)).toBe(true)
  })

  test('green: h=1/3, s=1, v=1', () => {
    const c = Color.fromHSV(1 / 3, 1, 1)
    expect(approx(c.r, 0)).toBe(true)
    expect(approx(c.g, 1)).toBe(true)
    expect(approx(c.b, 0)).toBe(true)
  })

  test('blue: h=2/3, s=1, v=1', () => {
    const c = Color.fromHSV(2 / 3, 1, 1)
    expect(approx(c.r, 0)).toBe(true)
    expect(approx(c.g, 0)).toBe(true)
    expect(approx(c.b, 1)).toBe(true)
  })

  test('black: v=0', () => {
    const c = Color.fromHSV(0, 1, 0)
    expect(approx(c.r, 0)).toBe(true)
    expect(approx(c.g, 0)).toBe(true)
    expect(approx(c.b, 0)).toBe(true)
  })

  test('white: s=0, v=1', () => {
    const c = Color.fromHSV(0, 0, 1)
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.g, 1)).toBe(true)
    expect(approx(c.b, 1)).toBe(true)
  })

  test('alpha defaults to 1', () => {
    const c = Color.fromHSV(0, 1, 1)
    expect(c.a).toBe(1)
  })

  test('alpha is passed through', () => {
    const c = Color.fromHSV(0, 1, 1, 0.5)
    expect(c.a).toBe(0.5)
  })

  test('roundtrip: fromHSV then .h/.s/.v', () => {
    const c = Color.fromHSV(0.75, 0.8, 0.6)
    expect(approx(c.h, 0.75, 0.01)).toBe(true)
    expect(approx(c.s, 0.8, 0.01)).toBe(true)
    expect(approx(c.v, 0.6, 0.01)).toBe(true)
  })
})

describe('Color named colors', () => {
  test('red is (1, 0, 0, 1)', () => {
    expect(Color.red.r).toBe(1)
    expect(Color.red.g).toBe(0)
    expect(Color.red.b).toBe(0)
    expect(Color.red.a).toBe(1)
  })

  test('black is (0, 0, 0, 1)', () => {
    expect(Color.black.r).toBe(0)
    expect(Color.black.g).toBe(0)
    expect(Color.black.b).toBe(0)
    expect(Color.black.a).toBe(1)
  })

  test('white is (1, 1, 1, 1)', () => {
    expect(Color.white.r).toBe(1)
    expect(Color.white.g).toBe(1)
    expect(Color.white.b).toBe(1)
    expect(Color.white.a).toBe(1)
  })

  test('transparent is (0, 0, 0, 0)', () => {
    expect(Color.transparent.r).toBe(0)
    expect(Color.transparent.a).toBe(0)
  })
})

describe('Color.names and Color.colors', () => {
  test('names is a non-empty array', () => {
    expect(Array.isArray(Color.names)).toBe(true)
    expect(Color.names.length).toBeGreaterThan(0)
  })

  test('names includes "red", "blue", "green"', () => {
    expect(Color.names).toContain('red')
    expect(Color.names).toContain('blue')
    expect(Color.names).toContain('green')
  })

  test('colors returns an object with Color values', () => {
    const colors = Color.colors
    expect(colors['red']).toBeInstanceOf(Color)
    expect(colors['blue']).toBeInstanceOf(Color)
  })

  test('colors is cached (same reference)', () => {
    expect(Color.colors).toBe(Color.colors)
  })

  test('all names have a corresponding entry in colors', () => {
    const colors = Color.colors
    for (const name of Color.names) {
      expect(colors[name]).toBeInstanceOf(Color)
    }
  })
})

describe('MutableColor', () => {
  test('can set r', () => {
    const c = new MutableColor(0, 0, 0, 1)
    c.r = 0.5
    expect(c.r).toBe(0.5)
  })

  test('can set g', () => {
    const c = new MutableColor(0, 0, 0, 1)
    c.g = 0.5
    expect(c.g).toBe(0.5)
  })

  test('can set b', () => {
    const c = new MutableColor(0, 0, 0, 1)
    c.b = 0.5
    expect(c.b).toBe(0.5)
  })

  test('can set a', () => {
    const c = new MutableColor(1, 1, 1, 1)
    c.a = 0
    expect(c.a).toBe(0)
  })

  test('setting r invalidates HSV cache', () => {
    const c = new MutableColor(1, 0, 0, 1)
    const _ = c.h
    c.r = 0
    c.g = 1
    expect(approx(c.h, 1 / 3, 0.01)).toBe(true)
  })

  test('addIn mutates and returns self', () => {
    const c = new MutableColor(0.1, 0.2, 0.3, 0.4)
    const b = new Color(0.1, 0.1, 0.1, 0.1)
    const returned = c.addIn(b)
    expect(returned).toBe(c)
    expect(approx(c.r, 0.2)).toBe(true)
    expect(approx(c.g, 0.3)).toBe(true)
    expect(approx(c.b, 0.4)).toBe(true)
    expect(approx(c.a, 0.5)).toBe(true)
  })

  test('subIn mutates and returns self', () => {
    const c = new MutableColor(0.5, 0.6, 0.7, 1)
    const b = new Color(0.1, 0.1, 0.2, 0.5)
    const returned = c.subIn(b)
    expect(returned).toBe(c)
    expect(approx(c.r, 0.4)).toBe(true)
    expect(approx(c.g, 0.5)).toBe(true)
    expect(approx(c.b, 0.5)).toBe(true)
    expect(approx(c.a, 0.5)).toBe(true)
  })

  test('mulIn mutates and returns self', () => {
    const c = new MutableColor(0.5, 0.4, 0.2, 1)
    const returned = c.mulIn(2)
    expect(returned).toBe(c)
    expect(approx(c.r, 1)).toBe(true)
    expect(approx(c.g, 0.8)).toBe(true)
    expect(approx(c.b, 0.4)).toBe(true)
    expect(approx(c.a, 2)).toBe(true)
  })

  test('divIn mutates and returns self', () => {
    const c = new MutableColor(1, 0.8, 0.4, 1)
    const returned = c.divIn(2)
    expect(returned).toBe(c)
    expect(approx(c.r, 0.5)).toBe(true)
    expect(approx(c.g, 0.4)).toBe(true)
    expect(approx(c.b, 0.2)).toBe(true)
    expect(approx(c.a, 0.5)).toBe(true)
  })

  test('is instance of Color', () => {
    const c = new MutableColor(1, 0, 0, 1)
    expect(c).toBeInstanceOf(Color)
    expect(c).toBeInstanceOf(MutableColor)
  })
})
