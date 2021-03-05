import * as THREE from './three.module.js'

function max (array) {
  return array.reduce((maxValue, value) => Math.max(maxValue, value))
}

function getTextWidth (lines, font) {
  if (lines.length) {
    let context = document.createElement('canvas').getContext('2d')
    context.font = font
    return max(lines.map(text => context.measureText(text).width))
  }
  return 0
}

export default class extends THREE.Texture {
  constructor ({
    align = 'center',
    anisotropy,
    fillStyle = '#fff',
    background = '#fff',
    fontFamily = 'sans-serif',
    fontSize = 16,
    fontStyle = 'normal',
    fontVariant = 'normal',
    fontWeight = 'normal',
    format,
    lineSpacing = 0.15,
    magFilter = THREE.LinearFilter,
    mapping,
    minFilter = THREE.LinearMipMapLinearFilter,
    padding = 0.25,
    strokeStyle = '#000',
    strokeWidth = 0,
    text = '',
    type,
    wrapS,
    wrapT
  } = {}) {
    super(
      document.createElement('canvas'),
      mapping,
      wrapS,
      wrapT,
      magFilter,
      minFilter,
      format,
      type,
      anisotropy
    )
    this._align = align
    this._fillStyle = fillStyle
    this._fontFamily = fontFamily
    this._fontSize = fontSize
    this._fontStyle = fontStyle
    this._fontVariant = fontVariant
    this._fontWeight = fontWeight
    this._lineSpacing = lineSpacing
    this._padding = padding
    this._strokeStyle = strokeStyle
    this._strokeWidth = strokeWidth
    this._text = text
    this._background = background
    this.redrawNow()
  }

  get align () {
    return this._align
  }

  set align (value) {
    if (this._align !== value) {
      this._align = value
      this.redraw()
    }
  }

  get fillStyle () {
    return this._fillStyle
  }

  set fillStyle (value) {
    if (this._fillStyle !== value) {
      this._fillStyle = value
      this.redraw()
    }
  }

  get font () {
    return [this.fontStyle, this.fontVariant, this.fontWeight, `${this.fontSize}px`, this.fontFamily].join(' ')
  }

  get fontFamily () {
    return this._fontFamily
  }

  set fontFamily (value) {
    if (this._fontFamily !== value) {
      this._fontFamily = value
      this._textWidthInPixels = undefined
      this.redraw()
    }
  }

  get fontSize () {
    return this._fontSize
  }

  set fontSize (value) {
    if (this._fontSize !== value) {
      this._fontSize = value
      this._textWidthInPixels = undefined
      this.redraw()
    }
  }

  get fontStyle () {
    return this._fontStyle
  }

  set fontStyle (value) {
    if (this._fontStyle !== value) {
      this._fontStyle = value
      this._textWidthInPixels = undefined
      this.redraw()
    }
  }

  get fontVariant () {
    return this._fontVariant
  }

  set fontVariant (value) {
    if (this._fontVariant !== value) {
      this._fontVariant = value
      this._textWidthInPixels = undefined
      this.redraw()
    }
  }

  get fontWeight () {
    return this._fontWeight
  }

  set fontWeight (value) {
    if (this._fontWeight !== value) {
      this._fontWeight = value
      this._textWidthInPixels = undefined
      this.redraw()
    }
  }

  get height () {
    return this.textHeight + this.strokeWidth + this.padding * 2
  }

  get heightInPixels () {
    if (this._heightInPixels === undefined) {
      this._heightInPixels = this.floorPowerOfTwo(this.height * this.fontSize)
    }
    return this._heightInPixels
  }

  get lines () {
    if (this._lines === undefined) {
      this._lines = this.text ? this.text.split('\n') : []
    }
    return this._lines
  }

  get lineSpacing () {
    return this._lineSpacing
  }

  set lineSpacing (value) {
    if (this._lineSpacing !== value) {
      this._lineSpacing = value
      this.redraw()
    }
  }

  get lineSpacingInPixels () {
    return this.fontSize * this.lineSpacing
  }

  get padding () {
    return this._padding
  }

  set padding (value) {
    if (this._padding !== value) {
      this._padding = value
      this.redraw()
    }
  }

  get paddingInPixels () {
    return this.padding * this.fontSize
  }

  redraw () {
    clearTimeout(this._redrawTimeoutId)
    this._redrawTimeoutId = setTimeout(() => {
      this.redrawNow()
    }, 0)
  }

  redrawNow () {
    clearTimeout(this._redrawTimeoutId)
    let canvas = this.image
    let context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)
    if (this.widthInPixels && this.heightInPixels) {
      canvas.width = this.widthInPixels
      canvas.height = this.heightInPixels
      context.fillStyle = this._background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.font = this.font
      context.textBaseline = 'middle'
      let left
      switch (this.align) {
        case 'left':
          context.textAlign = 'left'
          left = this.paddingInPixels + this.strokeWidthInPixels / 2
          break
        case 'right':
          context.textAlign = 'right'
          left = this.paddingInPixels + this.strokeWidthInPixels / 2 + this.textWidthInPixels
          break
        case 'center':
          context.textAlign = 'center'
          left = this.paddingInPixels + this.strokeWidthInPixels / 2 + this.textWidthInPixels / 2
          break
      }
      let top = this.paddingInPixels + this.strokeWidthInPixels / 2 + this.fontSize / 2
      context.fillStyle = this.fillStyle
      context.miterLimit = 1
      context.lineWidth = this.strokeWidthInPixels
      context.strokeStyle = this.strokeStyle
      this.lines.forEach(text => {
        if (this.strokeWidthInPixels) {
          context.strokeText(text, left, top)
        }
        context.fillText(text, left, top)
        top += this.fontSize + this.lineSpacingInPixels
      })
    } else {
      canvas.width = canvas.height = 1
    }
    this.needsUpdate = true
  }

  get strokeStyle () {
    return this._strokeStyle
  }

  set strokeStyle (value) {
    if (this._strokeStyle !== value) {
      this._strokeStyle = value
      this.redraw()
    }
  }

  get strokeWidth () {
    return this._strokeWidth
  }

  set strokeWidth (value) {
    if (this._strokeWidth !== value) {
      this._strokeWidth = value
      this.redraw()
    }
  }

  get strokeWidthInPixels () {
    return this._strokeWidth * this.fontSize
  }

  get text () {
    return this._text
  }

  set text (value) {
    if (this._text !== value) {
      this._text = value
      this._lines = undefined
      this._textWidthInPixels = undefined
      this.redraw()
    }
  }

  get textHeight () {
    return (this.lines.length ? this.lines.length + this.lineSpacing * (this.lines.length - 1) : 0)
  }

  get textHeightInPixels () {
    return this.textHeight * this.fontSize
  }

  get textWidthInPixels () {
    if (this._textWidthInPixels === undefined) {
      this._textWidthInPixels = getTextWidth(
        this.lines,
        this.font
      )
    }
    return this._textWidthInPixels
  }

  get widthInPixels () {
    if (this._widthInPixels === undefined) {
      this._widthInPixels = this.floorPowerOfTwo(this.textWidthInPixels + this.strokeWidthInPixels + this.paddingInPixels * 2)
    }
    return this._widthInPixels
  }

  floorPowerOfTwo (value) {
    return 2 ** Math.floor(Math.log(value) / Math.LN2)
  }
}
