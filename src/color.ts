/*Copyright (c) 2026 Juan Carlos González Amestoy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

let _colors: { [key: string]: Color } | undefined

/**
 * Returns the fractional part of a number.
 * @param x Input value
 * @returns Fractional part of x
 */
const fract = (x: number): number => {
  return x - Math.floor(x)
}

/**
 * Linearly interpolates between two values.
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor in [0, 1]
 * @returns Interpolated value
 */
const interpolate = (a: number, b: number, t: number): number => {
  return a + (b - a) * t
}

/**
 * Clamps a value between min and max.
 * @param x Input value
 * @param min Lower bound (default 0)
 * @param max Upper bound (default 1)
 * @returns Clamped value
 */
const clamp = (x: number, min: number=0, max: number=1): number => {
  const c = x > min ? x : min
  return max < c ? max : c
}

/**
 * Immutable RGBA color with components stored as floating-point values in [0, 1].
 * Supports construction from hex strings, packed integers, and RGB(A) components.
 * HSV components and ANSI escape sequences are computed lazily and cached.
 */
export class Color {
  protected _r: number
  protected _g: number
  protected _b: number
  protected _a: number

  protected _h: number | undefined
  protected _s: number | undefined
  protected _v: number | undefined

  // Cached ANSI escape sequences. Populated lazily by toAnsiRGB() and
  // toAnsiBackgroundRGB() and reset to undefined by any code that mutates
  // _r/_g/_b (see interpolateIn here, and the setters/*In methods in
  // MutableColor). For the static readonly named colors these are computed
  // once per process and reused forever.
  protected _ansiFg: string | undefined
  protected _ansiBg: string | undefined

  /**
   * Construct a color from a string or RGB components
   * @param s A color string in the format #RRGGBB
   */
  constructor(s: string)

  /**
   * Construct a color from RGB components
   * @param r The red component
   * @param g The green component
   * @param b The blue component
   * @param a The alpha component defaults to 1.0
   */
  constructor(r: number, g: number, b: number, a: number)
  constructor(r: number, g: number, b: number)

  /**
   * Construct a color from a single integer in the format 0xAABBGGRR (little-endian)
   * @param c The color as a single integer in the format 0xAABBGGRR
   */
  constructor(c: number)

  constructor(rs: number | string, g?: number, b?: number, a: number = 1.0) {
    if (typeof rs === 'number' && g !== undefined && b !== undefined) {
      this._r = rs
      this._g = g
      this._b = b
      this._a = a
    } else if (typeof rs === 'number' && g === undefined && b === undefined) {
      this._r = (rs & 0xff) / 255
      this._g = ((rs >> 8) & 0xff) / 255
      this._b = ((rs >> 16) & 0xff) / 255
      this._a = ((rs >> 24) & 0xff) / 255
    } else if (typeof rs === 'string') {
      const match = rs.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i)

      if (match) {
        this._r = parseInt(match[1]!, 16) / 255
        this._g = parseInt(match[2]!, 16) / 255
        this._b = parseInt(match[3]!, 16) / 255
        this._a = match[4] ? parseInt(match[4], 16) / 255 : 1.0
      } else {
        const match = rs.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i)

        if (match) {
          this._r = parseInt(match[1]!, 16) / 15
          this._g = parseInt(match[2]!, 16) / 15
          this._b = parseInt(match[3]!, 16) / 15
          this._a = match[4] ? parseInt(match[4], 16) / 15 : 1.0
        } else {
          throw new Error('Invalid color string')
        }
      }
    } else {
      throw new Error('Invalid arguments')
    }
  }

  /**
   * Get the red component
   * @returns {number}
   * @readonly
   */
  get r() {
    return this._r
  }

  /**
   * Get the green component
   * @returns {number}
   * @readonly
   */
  get g() {
    return this._g
  }

  /**
   * Get the blue component
   * @returns {number}
   * @readonly
   */
  get b() {
    return this._b
  }

  /**
   * Get the alpha component
   * @returns {number}
   * @readonly
   */
  get a() {
    return this._a
  }

  /**
   * Get the hue component
   * @returns {number}
   * @readonly
   */
  get h() {
    if (this._h === undefined) {
      const M = Math.max(this._r, this._g, this._b)
      const m = Math.min(this._r, this._g, this._b)
      const c = M - m

      if (c === 0) {
        this._h = 0
      } else if (M === this._r) {
        this._h = ((this._g - this._b) / c) % 6
      } else if (M === this._g) {
        this._h = (this._b - this._r) / c + 2
      } else {
        this._h = (this._r - this._g) / c + 4
      }

      this._h *= 60

      if (this._h < 0) {
        this._h += 360
      }
    }

    return this._h / 360
  }

  /**
   * Get the saturation component
   * @returns {number}
   * @readonly
   */
  get s() {
    if (this._s === undefined) {
      const M = Math.max(this._r, this._g, this._b)
      const m = Math.min(this._r, this._g, this._b)
      this._s = M !== 0 ? (M - m) / M : 0
    }

    return this._s
  }

  /**
   * Get the value component
   * @returns {number}
   * @readonly
   */
  get v() {
    if (this._v === undefined) {
      this._v = Math.max(this._r, this._g, this._b)
    }

    return this._v
  }

  /**
   * Add two colors together and return a new color
   * @param {Color} c color to add
   * @returns {Color}
   */
  add(c: Color): Color {
    return new Color(this._r + c._r, this._g + c._g, this._b + c._b, this._a + c._a)
  }

  /**
   * Subtract two colors and return a new color
   * @param {Color} c Color to subtract
   * @returns {Color}
   */
  sub(c: Color): Color {
    return new Color(this._r - c._r, this._g - c._g, this._b - c._b, this._a - c._a)
  }

  /**
   * Multiply a color by a scalar and return a new color
   * @param {number} n Scalar to multiply
   * @returns {Color}
   */
  mul(n: number): Color {
    return new Color(this._r * n, this._g * n, this._b * n, this._a * n)
  }

  /**
   * Divide a color by a scalar and return a new color
   * @param {number} n Scalar to divide
   * @returns {Color}
   */
  div(n: number): Color {
    return new Color(this._r / n, this._g / n, this._b / n, this._a / n)
  }

  /**
   * Interpolate between two colors and return a new color
   * @param {Color} c Color to interpolate to
   * @param {number} t Interpolation factor
   * @returns {Color}
   */
  interpolate(c: Color, t: number): Color {
    return new Color(this._r + (c._r - this._r) * t, this._g + (c._g - this._g) * t, this._b + (c._b - this._b) * t, this._a + (c._a - this._a) * t)
  }

  /**
   * Interpolate between two colors and modify the current color
   * @param {Color} c Color to interpolate to
   * @param {number} t Interpolation factor
   * @returns {Color}
   */
  interpolateIn(c: Color, t: number): Color {
    this._r += (c._r - this._r) * t
    this._g += (c._g - this._g) * t
    this._b += (c._b - this._b) * t
    this._a += (c._a - this._a) * t
    this._invalidateCaches()
    return this
  }

  /**
   * Clears all derived caches (HSV and ANSI). Must be called by any code
   * that mutates _r/_g/_b/_a after construction.
   */
  protected _invalidateCaches(): void {
    this._h = undefined
    this._s = undefined
    this._v = undefined
    this._ansiFg = undefined
    this._ansiBg = undefined
  }

  /**
   * Returns the color as a packed 32-bit integer in 0xAABBGGRR format (little-endian).
   * @returns {number} Unsigned 32-bit integer representing the color
   */
  toRGBA(): number {
    return (
      (Math.round(this._a * 255) << 24 |
       Math.round(this._b * 255) << 16 |
       Math.round(this._g * 255) << 8  |
       Math.round(this._r * 255)) >>> 0
    )
  }

  /**
   * Return a string representation of the color
   * @returns {string}
   */
  toString() {
    return `#${Math.round(this._r * 255)
      .toString(16)
      .padStart(2, '0')}${Math.round(this._g * 255)
      .toString(16)
      .padStart(2, '0')}${Math.round(this._b * 255)
      .toString(16)
      .padStart(2, '0')}${Math.round(this._a * 255)
      .toString(16)
      .padStart(2, '0')}`
  }

  /**
   * Converts the current color to an ANSI escape sequence for styling text color in the terminal.
   * @returns {string} The ANSI escape sequence representing the RGB color of the text.
   */
  toAnsiRGB() {
    return this._ansiFg ??= `\x1b[38;2;${Math.floor(this._r * 255)};${Math.floor(this._g * 255)};${Math.floor(this._b * 255)}m`
  }

  /**
   * Converts the current color to an ANSI escape sequence for styling background color of the text in the terminal.
   * @returns {string} The ANSI escape sequence representing the RGB color of the text background.
   */
  toAnsiBackgroundRGB() {
    return this._ansiBg ??= `\x1b[48;2;${Math.floor(this._r * 255)};${Math.floor(this._g * 255)};${Math.floor(this._b * 255)}m`
  }

  //Static methods

  /**
   * Create a color from hue, saturation, and value
   * @param {number} h Hue
   * @param {number} s Saturation
   * @param {number} v Value
   * @param {number} a Alpha defaults to 1.0
   * @returns {Color}
   */
  static fromHSV(h: number, s: number, v: number, a: number = 1.0): Color {
    let r = h + 1
    let g = h + 2 / 3
    let b = h + 1 / 3

    r = Math.abs(fract(r) * 6 - 3)
    g = Math.abs(fract(g) * 6 - 3)
    b = Math.abs(fract(b) * 6 - 3)

    r = v * interpolate(1, clamp(r - 1), s)
    g = v * interpolate(1, clamp(g - 1), s)
    b = v * interpolate(1, clamp(b - 1), s)

    r = Math.round(r * 10000) / 10000
    g = Math.round(g * 10000) / 10000
    b = Math.round(b * 10000) / 10000

    return new Color(r, g, b, a)
  }

  // #region Named colors
  static readonly aliceBlue = new Color(0.941176, 0.972549, 1.0, 1.0)
  static readonly antiqueWhite = new Color(0.980392, 0.921569, 0.843137, 1.0)
  static readonly aqua = new Color(0.0, 1.0, 1.0, 1.0)
  static readonly aquamarine = new Color(0.498039, 1.0, 0.831373, 1.0)
  static readonly azure = new Color(0.941176, 1.0, 1.0, 1.0)
  static readonly beige = new Color(0.960784, 0.960784, 0.862745, 1.0)
  static readonly bisque = new Color(1.0, 0.894118, 0.768627, 1.0)
  static readonly black = new Color(0.0, 0.0, 0.0, 1.0)
  static readonly blanchedAlmond = new Color(1.0, 0.921569, 0.803922, 1.0)
  static readonly blue = new Color(0.0, 0.0, 1.0, 1.0)
  static readonly blueViolet = new Color(0.541176, 0.168627, 0.886275, 1.0)
  static readonly brown = new Color(0.647059, 0.164706, 0.164706, 1.0)
  static readonly burlyWood = new Color(0.870588, 0.721569, 0.529412, 1.0)
  static readonly cadetBlue = new Color(0.372549, 0.619608, 0.627451, 1.0)
  static readonly chartreuse = new Color(0.498039, 1.0, 0.0, 1.0)
  static readonly chocolate = new Color(0.823529, 0.411765, 0.117647, 1.0)
  static readonly coral = new Color(1.0, 0.498039, 0.313725, 1.0)
  static readonly cornflowerBlue = new Color(0.392157, 0.584314, 0.929412, 1.0)
  static readonly cornsilk = new Color(0.882353, 0.972549, 0.862745, 1.0)
  static readonly crimson = new Color(0.862745, 0.078431, 0.235294, 1.0)
  static readonly cyan = new Color(0.0, 1.0, 1.0, 1.0)
  static readonly darkBlue = new Color(0.0, 0.0, 0.545098, 1.0)
  static readonly darkCyan = new Color(0.0, 0.545098, 0.545098, 1.0)
  static readonly darkGoldenrod = new Color(0.721569, 0.52549, 0.043137, 1.0)
  static readonly darkGray = new Color(0.662745, 0.662745, 0.662745, 1.0)
  static readonly darkGreen = new Color(0.0, 0.392157, 0.0, 1.0)
  static readonly darkKhaki = new Color(0.741176, 0.717647, 0.419608, 1.0)
  static readonly darkMagenta = new Color(0.545098, 0.0, 0.545098, 1.0)
  static readonly darkOliveGreen = new Color(0.333333, 0.419608, 0.184314, 1.0)
  static readonly darkOrange = new Color(1.0, 0.54902, 0.0, 1.0)
  static readonly darkOrchid = new Color(0.6, 0.196078, 0.8, 1.0)
  static readonly darkRed = new Color(0.545098, 0.0, 0.0, 1.0)
  static readonly darkSalmon = new Color(0.913725, 0.588235, 0.478431, 1.0)
  static readonly darkSeaGreen = new Color(0.560784, 0.737255, 0.560784, 1.0)
  static readonly darkSlateBlue = new Color(0.282353, 0.239216, 0.545098, 1.0)
  static readonly darkSlateGray = new Color(0.184314, 0.309804, 0.309804, 1.0)
  static readonly darkTurquoise = new Color(0.0, 0.807843, 0.819608, 1.0)
  static readonly darkViolet = new Color(0.580392, 0.0, 0.827451, 1.0)
  static readonly deepPink = new Color(1.0, 0.078431, 0.576471, 1.0)
  static readonly deepSkyBlue = new Color(0.0, 0.74902, 1.0, 1.0)
  static readonly dimGray = new Color(0.411765, 0.411765, 0.411765, 1.0)
  static readonly dodgerBlue = new Color(0.117647, 0.564706, 1.0, 1.0)
  static readonly fireBrick = new Color(0.698039, 0.133333, 0.133333, 1.0)
  static readonly floralWhite = new Color(1.0, 0.980392, 0.941176, 1.0)
  static readonly forestGreen = new Color(0.133333, 0.545098, 0.133333, 1.0)
  static readonly fuchsia = new Color(1.0, 0.0, 1.0, 1.0)
  static readonly gainsboro = new Color(0.862745, 0.862745, 0.862745, 1.0)
  static readonly ghostWhite = new Color(0.972549, 0.972549, 1.0, 1.0)
  static readonly gold = new Color(1.0, 0.843137, 0.0, 1.0)
  static readonly goldenrod = new Color(0.854902, 0.647059, 0.12549, 1.0)
  static readonly gray = new Color(0.501961, 0.501961, 0.501961, 1.0)
  static readonly green = new Color(0.0, 0.501961, 0.0, 1.0)
  static readonly greenYellow = new Color(0.678431, 1.0, 0.184314, 1.0)
  static readonly honeydew = new Color(0.941176, 1.0, 0.941176, 1.0)
  static readonly hotPink = new Color(1.0, 0.411765, 0.705882, 1.0)
  static readonly indianRed = new Color(0.803922, 0.360784, 0.360784, 1.0)
  static readonly indigo = new Color(0.294118, 0.0, 0.509804, 1.0)
  static readonly ivory = new Color(1.0, 1.0, 0.941176, 1.0)
  static readonly khaki = new Color(0.941176, 0.901961, 0.54902, 1.0)
  static readonly lavender = new Color(0.901961, 0.901961, 0.980392, 1.0)
  static readonly lavenderBlush = new Color(1.0, 0.941176, 0.960784, 1.0)
  static readonly lawnGreen = new Color(0.486275, 0.988235, 0.0, 1.0)
  static readonly lemonChiffon = new Color(1.0, 0.980392, 0.803922, 1.0)
  static readonly lightBlue = new Color(0.678431, 0.847059, 0.901961, 1.0)
  static readonly lightCoral = new Color(0.941176, 0.501961, 0.501961, 1.0)
  static readonly lightCyan = new Color(0.878431, 1.0, 1.0, 1.0)
  static readonly lightGoldenrodYellow = new Color(0.980392, 0.980392, 0.823529, 1.0)
  static readonly lightGreen = new Color(0.564706, 0.933333, 0.564706, 1.0)
  static readonly lightGrey = new Color(0.827451, 0.827451, 0.827451, 1.0)
  static readonly lightPink = new Color(1.0, 0.713725, 0.756863, 1.0)
  static readonly lightSalmon = new Color(1.0, 0.627451, 0.478431, 1.0)
  static readonly lightSeaGreen = new Color(0.12549, 0.698039, 0.666667, 1.0)
  static readonly lightSkyBlue = new Color(0.529412, 0.807843, 0.980392, 1.0)
  static readonly lightSlateGray = new Color(0.466667, 0.533333, 0.6, 1.0)
  static readonly lightSteelBlue = new Color(0.690196, 0.768627, 0.870588, 1.0)
  static readonly lightYellow = new Color(1.0, 1.0, 0.878431, 1.0)
  static readonly lime = new Color(0.0, 1.0, 0.0, 1.0)
  static readonly limeGreen = new Color(0.196078, 0.803922, 0.196078, 1.0)
  static readonly linen = new Color(0.980392, 0.941176, 0.901961, 1.0)
  static readonly magenta = new Color(1.0, 0.0, 1.0, 1.0)
  static readonly maroon = new Color(0.501961, 0.0, 0.0, 1.0)
  static readonly mediumAquamarine = new Color(0.4, 0.803922, 0.666667, 1.0)
  static readonly mediumBlue = new Color(0.0, 0.0, 0.803922, 1.0)
  static readonly mediumOrchid = new Color(0.729412, 0.333333, 0.827451, 1.0)
  static readonly mediumPurple = new Color(0.576471, 0.439216, 0.858824, 1.0)
  static readonly mediumSeaGreen = new Color(0.235294, 0.701961, 0.443137, 1.0)
  static readonly mediumSlateBlue = new Color(0.482353, 0.407843, 0.933333, 1.0)
  static readonly mediumSpringGreen = new Color(0.0, 0.980392, 0.603922, 1.0)
  static readonly mediumTurquoise = new Color(0.282353, 0.819608, 0.8, 1.0)
  static readonly mediumVioletRed = new Color(0.780392, 0.082353, 0.521569, 1.0)
  static readonly midnightBlue = new Color(0.098039, 0.098039, 0.439216, 1.0)
  static readonly mintCream = new Color(0.960784, 1.0, 0.980392, 1.0)
  static readonly mistyRose = new Color(1.0, 0.894118, 0.882353, 1.0)
  static readonly moccasin = new Color(1.0, 0.894118, 0.709804, 1.0)
  static readonly navajoWhite = new Color(1.0, 0.870588, 0.678431, 1.0)
  static readonly navy = new Color(0.0, 0.0, 0.501961, 1.0)
  static readonly oldLace = new Color(0.992157, 0.960784, 0.901961, 1.0)
  static readonly olive = new Color(0.501961, 0.501961, 0.0, 1.0)
  static readonly oliveDrab = new Color(0.419608, 0.556863, 0.137255, 1.0)
  static readonly orange = new Color(1.0, 0.647059, 0.0, 1.0)
  static readonly orangeRed = new Color(1.0, 0.270588, 0.0, 1.0)
  static readonly orchid = new Color(0.854902, 0.439216, 0.839216, 1.0)
  static readonly paleGoldenrod = new Color(0.933333, 0.909804, 0.666667, 1.0)
  static readonly paleGreen = new Color(0.596078, 0.984314, 0.596078, 1.0)
  static readonly paleTurquoise = new Color(0.686275, 0.933333, 0.933333, 1.0)
  static readonly paleVioletRed = new Color(0.858824, 0.439216, 0.576471, 1.0)
  static readonly papayaWhip = new Color(1.0, 0.937255, 0.835294, 1.0)
  static readonly peachPuff = new Color(1.0, 0.854902, 0.72549, 1.0)
  static readonly peru = new Color(0.803922, 0.521569, 0.247059, 1.0)
  static readonly pink = new Color(1.0, 0.752941, 0.796078, 1.0)
  static readonly plum = new Color(0.866667, 0.627451, 0.866667, 1.0)
  static readonly powderBlue = new Color(0.690196, 0.878431, 0.901961, 1.0)
  static readonly purple = new Color(0.501961, 0.0, 0.501961, 1.0)
  static readonly red = new Color(1.0, 0.0, 0.0, 1.0)
  static readonly rosyBrown = new Color(0.737255, 0.560784, 0.560784, 1.0)
  static readonly royalBlue = new Color(0.254902, 0.411765, 0.882353, 1.0)
  static readonly saddleBrown = new Color(0.545098, 0.270588, 0.07451, 1.0)
  static readonly salmon = new Color(0.980392, 0.501961, 0.447059, 1.0)
  static readonly sandyBrown = new Color(0.956863, 0.643137, 0.376471, 1.0)
  static readonly seaGreen = new Color(0.180392, 0.545098, 0.380392, 1.0)
  static readonly seashell = new Color(1.0, 0.960784, 0.933333, 1.0)
  static readonly sienna = new Color(0.627451, 0.321569, 0.176471, 1.0)
  static readonly silver = new Color(0.752941, 0.752941, 0.752941, 1.0)
  static readonly skyBlue = new Color(0.529412, 0.807843, 0.921569, 1.0)
  static readonly slateBlue = new Color(0.415686, 0.352941, 0.803922, 1.0)
  static readonly slateGray = new Color(0.466667, 0.533333, 0.6, 1.0)
  static readonly snow = new Color(1.0, 0.980392, 0.980392, 1.0)
  static readonly springGreen = new Color(0.0, 1.0, 0.498039, 1.0)
  static readonly steelBlue = new Color(0.27451, 0.509804, 0.705882, 1.0)
  static readonly tan = new Color(0.823529, 0.705882, 0.54902, 1.0)
  static readonly teal = new Color(0.0, 0.501961, 0.501961, 1.0)
  static readonly thistle = new Color(0.847059, 0.74902, 0.847059, 1.0)
  static readonly tomato = new Color(1.0, 0.388235, 0.278431, 1.0)
  static readonly transparent = new Color(0.0, 0.0, 0.0, 0.0)
  static readonly turquoise = new Color(0.25098, 0.878431, 0.815686, 1.0)
  static readonly violet = new Color(0.933333, 0.509804, 0.933333, 1.0)
  static readonly wheat = new Color(0.960784, 0.870588, 0.701961, 1.0)
  static readonly white = new Color(1.0, 1.0, 1.0, 1.0)
  static readonly whiteSmoke = new Color(0.960784, 0.960784, 0.960784, 1.0)
  static readonly yellow = new Color(1.0, 1.0, 0.0, 1.0)
  static readonly yellowGreen = new Color(0.603922, 0.803922, 0.196078, 1.0)

  /** List of all named color identifiers available as static properties on {@link Color}. */
  static readonly names: string[] = ['aliceBlue', 'antiqueWhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black', 'blanchedAlmond', 'blue', 'blueViolet', 'brown', 'burlyWood', 'cadetBlue', 'chartreuse', 'chocolate', 'coral', 'cornflowerBlue', 'cornsilk', 'crimson', 'cyan', 'darkBlue', 'darkCyan', 'darkGoldenrod', 'darkGray', 'darkGreen', 'darkKhaki', 'darkMagenta', 'darkOliveGreen', 'darkOrange', 'darkOrchid', 'darkRed', 'darkSalmon', 'darkSeaGreen', 'darkSlateBlue', 'darkSlateGray', 'darkTurquoise', 'darkViolet', 'deepPink', 'deepSkyBlue', 'dimGray', 'dodgerBlue', 'fireBrick', 'floralWhite', 'forestGreen', 'fuchsia', 'gainsboro', 'ghostWhite', 'gold', 'goldenrod', 'gray', 'green', 'greenYellow', 'honeydew', 'hotPink', 'indianRed', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderBlush', 'lawnGreen', 'lemonChiffon', 'lightBlue', 'lightCoral', 'lightCyan', 'lightGoldenrodYellow', 'lightGreen', 'lightGrey', 'lightPink', 'lightSalmon', 'lightSeaGreen', 'lightSkyBlue', 'lightSlateGray', 'lightSteelBlue', 'lightYellow', 'lime', 'limeGreen', 'linen', 'magenta', 'maroon', 'mediumAquamarine', 'mediumBlue', 'mediumOrchid', 'mediumPurple', 'mediumSeaGreen', 'mediumSlateBlue', 'mediumSpringGreen', 'mediumTurquoise', 'mediumVioletRed', 'midnightBlue', 'mintCream', 'mistyRose', 'moccasin', 'navajoWhite', 'navy', 'oldLace', 'olive', 'oliveDrab', 'orange', 'orangeRed', 'orchid', 'paleGoldenrod', 'paleGreen', 'paleTurquoise', 'paleVioletRed', 'papayaWhip', 'peachPuff', 'peru', 'pink', 'plum', 'powderBlue', 'purple', 'red', 'rosyBrown', 'royalBlue', 'saddleBrown', 'salmon', 'sandyBrown', 'seaGreen', 'seashell', 'sienna', 'silver', 'skyBlue', 'slateBlue', 'slateGray', 'snow', 'springGreen', 'steelBlue', 'tan', 'teal', 'thistle', 'tomato', 'transparent', 'turquoise', 'violet', 'wheat', 'white', 'whiteSmoke', 'yellow', 'yellowGreen']

  /**
   * Returns a dictionary mapping each color name to its {@link Color} instance.
   * The result is computed once and cached for subsequent calls.
   * @returns {{ [key: string]: Color }}
   */
  static get colors() {
    if(_colors === undefined) {
      _colors = {}
      const _c=_colors as any
      const o=Color as any
         
      Color.names.forEach(name => {
        _c[name] = o[name] 
      })
    }

    return _colors
  }

  // #endregion
}

/**
 * A mutable variant of {@link Color} whose RGBA components can be changed after construction.
 * All setters invalidate the cached HSV and ANSI values automatically.
 */
export class MutableColor extends Color {
  /**
   * Construct a mutable color from RGB(A) components.
   * @param r Red component in [0, 1]
   * @param g Green component in [0, 1]
   * @param b Blue component in [0, 1]
   * @param a Alpha component in [0, 1], defaults to 1.0
   */
  constructor(r: number, g: number, b: number, a: number = 1.0) {
    super(r, g, b, a)
  }

  override get r() {
    return this._r
  }

  /** Sets the red component and invalidates caches. */
  override set r(r: number) {
    this._r = r
    this._invalidateCaches()
  }

  override get g() {
    return this._g
  }

  /** Sets the green component and invalidates caches. */
  override set g(g: number) {
    this._g = g
    this._invalidateCaches()
  }

  override get b() {
    return this._b
  }

  /** Sets the blue component and invalidates caches. */
  override set b(b: number) {
    this._b = b
    this._invalidateCaches()
  }

  override get a() {
    return this._a
  }

  /** Sets the alpha component and invalidates caches. */
  override set a(a: number) {
    this._a = a
    this._invalidateCaches()
  }

  /**
   * Add two colors together and modify the current color
   * @param {Color} c Color to add
   * @returns {Color}
   */
  addIn(c: Color): Color {
    this._r += c.r
    this._g += c.g
    this._b += c.b
    this._a += c.a
    this._invalidateCaches()
    return this
  }

  /**
   * Subtract two colors and modify the current color
   * @param {Color} c Color to subtract
   * @returns {Color}
   */
  subIn(c: Color): Color {
    this._r -= c.r
    this._g -= c.g
    this._b -= c.b
    this._a -= c.a
    this._invalidateCaches()
    return this
  }

  /**
   * Multiply a color by a scalar and modify the current color
   * @param {number} n Scalar to multiply
   * @returns {Color}
   */
  mulIn(n: number): Color {
    this._r *= n
    this._g *= n
    this._b *= n
    this._a *= n
    this._invalidateCaches()
    return this
  }

  /**
   * Divide a color by a scalar and modify the current color
   * @param {number} n Scalar to divide
   * @returns {Color}
   */
  divIn(n: number): Color {
    this._r /= n
    this._g /= n
    this._b /= n
    this._a /= n
    this._invalidateCaches()
    return this
  }
}