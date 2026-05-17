# @retrovm/color

Immutable and mutable RGB color classes with HSV conversion, ANSI terminal output, and a full set of named CSS colors.

## Install

```sh
bun add @retrovm/color
```

## Usage

```ts
import { Color, MutableColor } from "@retrovm/color"

// From hex string
const red = new Color("#ff0000")

// From RGB components (0.0 – 1.0)
const green = new Color(0, 1, 0, 1)

// Named colors
const blue = Color.blue
const white = Color.white

// From HSV
const hsvColor = Color.fromHSV(0.6, 0.8, 1.0)

// Operations (return new Color)
const mixed = red.interpolate(blue, 0.5)
const brighter = red.mul(1.2)

// ANSI terminal output
console.log(red.toAnsiRGB() + "Hello" + "\x1b[0m")
console.log(red.toAnsiBackgroundRGB() + "Hello" + "\x1b[0m")

// Convert to hex string
console.log(red.toString()) // "#ff0000ff"
```

## MutableColor

`MutableColor` extends `Color` with setters and in-place operations:

```ts
const c = new MutableColor(1, 0, 0)
c.r = 0.5
c.addIn(Color.blue)
c.mulIn(0.8)
c.interpolateIn(Color.white, 0.2)
```

## API

### `new Color(hex: string)`
### `new Color(r, g, b, a?)`

Components are in the `0.0 – 1.0` range.

### Properties (read-only on `Color`)

| Property | Description |
|----------|-------------|
| `r, g, b, a` | RGBA components |
| `h, s, v` | HSV components (computed lazily) |

### Methods

| Method | Description |
|--------|-------------|
| `add(c)` | Add two colors |
| `sub(c)` | Subtract two colors |
| `mul(n)` | Multiply by scalar |
| `div(n)` | Divide by scalar |
| `interpolate(c, t)` | Interpolate toward `c` by factor `t` |
| `interpolateIn(c, t)` | Interpolate in place |
| `toAnsiRGB()` | ANSI foreground escape sequence |
| `toAnsiBackgroundRGB()` | ANSI background escape sequence |
| `toString()` | Hex string `#rrggbbaa` |

### Static

| | Description |
|-|-------------|
| `Color.fromHSV(h, s, v, a?)` | Construct from HSV |
| `Color.names` | Array of all named color names |
| `Color.colors` | Object map of all named colors |
| `Color.red`, `Color.blue`, … | 140+ named CSS colors |

## License

MIT
