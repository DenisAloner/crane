import {
  createMixinComponent,
  PropertySize,
  ObservablePropertyVisible,
  ObservablePropertyTextContent,
  ObservablePropertyFontSize,
  PropertyObservers,
  PropertyVisible,
  PropertyDisabled,
} from './mixin.js'
import { getTextWidth } from './get-text-size.js'

function ripple(event) {
  const rect = this.getBoundingClientRect()
  const c = 16
  const d = Math.max(rect.width, rect.height) / (2 * c)
  const r = d / 2
  const x = event.offsetX
  const y = event.offsetY
  const rippleDiv = document.createElement('div')
  rippleDiv.classList.add('ripple')
  rippleDiv.setAttribute(
    'style',
    `left:${x - r}px;top:${y - r}px;width:${d}px;height:${d}px;`
  )
  // const customColor = this.getAttribute('ripple-color')
  // if (customColor) rippleDiv.style.background = customColor
  this.append(rippleDiv)
  setTimeout(function () {
    rippleDiv.remove()
  }, 300)
}

export class Button extends createMixinComponent(
  PropertySize,
  ObservablePropertyVisible,
  ObservablePropertyTextContent,
  ObservablePropertyFontSize
) {
  constructor(label) {
    super()
    this.domComponent = document.createElement('label')
    this.domComponent.className = 'button_Component'
    this[PropertyObservers].fontSize.subscribe(this.textWidthUpdate.bind(this))
    this[PropertyObservers].textContent.subscribe(
      this.textWidthUpdate.bind(this)
    )
    this.textContent = label
    this.domComponent.addEventListener(
      'mousedown',
      ripple.bind(this.domComponent)
    )
  }

  textWidthUpdate() {
    this.textWidth = getTextWidth(this.textContent, this.fontSize)
  }

  click(fn, target) {
    const delegate = target !== undefined ? fn.bind(target) : fn
    this.domComponent.addEventListener('click', delegate)
    return () => {
      this.domComponent.removeEventListener('click', delegate)
    }
  }

  resizeText() {
    this.domComponent.style.lineHeight = this.domComponent.style.height
    this.fontSize = `calc(${this.domComponent.style.height} - 12px)`
    this.domComponent.style.textAlign = 'center'
  }
}

export class InputButton extends Button {
  constructor(label, callback) {
    super(label)
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'
    input.addEventListener('change', callback)
    this.domComponent.append(input)
  }
}

export class MaskButton extends createMixinComponent(
  PropertySize,
  PropertyVisible,
  PropertyDisabled
) {
  constructor(mask, onClick) {
    super()
    this.domComponent = document.createElement('div')
    this.domIcon = document.createElement('div')
    this.domIcon.className = `iconButton_Component ${mask}`
    this.domIcon.addEventListener('click', onClick || null)
    this.domComponent.append(this.domIcon)
  }
}

export class IconButton extends createMixinComponent(PropertyVisible) {
  constructor(mask, onClick) {
    super()
    this.domComponent = document.createElement('div')
    this.domComponent.className = `iconButton_Component ${mask}`
    this.domComponent.addEventListener('click', onClick || null)
  }
}

export class CheckBox {
  constructor() {
    this._value = false
    this._block = false
  }

  init() {
    this.create = true
    this.domComponent = document.createElement('div')
    this.domComponent.className =
      'checkBox_Component buttonComponent firstColor'
    this.domComponent.tabIndex = 0
    this.domComponent.addEventListener(
      'mousedown',
      () => {
        this.value = !this.value
      },
      true
    )
    this.domIcon = document.createElement('div')
    this.domComponent.append(this.domIcon)
  }

  get value() {
    return this._value
  }

  set value(value) {
    if (value) {
      this.domIcon.className = 'check'
    } else {
      this.domIcon.removeAttribute('class')
    }
    this._value = value
  }

  get block() {
    return this._block
  }

  set block(newValue) {
    this._block = newValue
  }
}
