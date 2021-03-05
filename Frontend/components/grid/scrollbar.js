import { createMixinComponent, PropertySize, Scrollable } from '../../mixin.js'
import { clamp } from '../../api.js'
import { lazyCSS } from '../../lazy-css.js'

class Thumb extends createMixinComponent(PropertySize) {
  constructor () {
    super()
    if (this.constructor.lazyCSS === undefined) {
      lazyCSS(this.constructor,
        'Component{position:absolute;background-color:var(--first-color);border-radius:4px;filter:var(--drop-shadow-2dp-bottom)}'
      )
    }
    this.domComponent = document.createElement('div')
    this.domComponent.className = `component ${this.constructor.lazyCSS}Component`
  }
}

export class ScrollBar extends createMixinComponent(PropertySize, Scrollable) {
  constructor (owner) {
    super()
    if (this.constructor.lazyCSS === undefined) {
      lazyCSS(this.constructor,
        'Component{transition:opacity .25s linear,visible 0.25s linear;pointer-events:none}',
        'Track{background-color:var(--second-color);box-shadow:var(--box-shadow-1dp-left);pointer-events:all}',
        'Info{background:rgba(var(--first-color-rgb),.1);pointer-events:none;opacity:0;transition:opacity .25s linear;font-size:288px;display:flex;align-items:center;justify-content:center}',
        'Text{fill:rgba(var(--first-color-rgb),.5);font-size:50px;dominant-baseline:middle;text-anchor:middle}'
      )
    }
    this.owner = owner
    this.domComponent = document.createElement('div')
    this.domComponent.className = `componentWrap ${this.constructor.lazyCSS}Component`
    this.domTrack = document.createElement('div')
    this.domTrack.className = `componentWrap ${this.constructor.lazyCSS}Track`
    this.domComponent.append(this.domTrack)
    this.domInformant = document.createElement('span')
    this.domInformant.className = `componentWrap ${this.constructor.lazyCSS}Info`
    this.domComponent.append(this.domInformant)
    this.thumb = new Thumb()
    this.domTrack.append(this.thumb.domComponent)

    this.bindScrollEvents(this.domTrack)
    this.ratio = 0
    this.onScroll = undefined
    this.scrolling = false
    this._visible = true

    this.domTrack.style.right = 0
    this.domTrack.style.width = '24px'
    this.domTrack.style.height = '100%'
    this.thumb.domComponent.style.left = '3px'
    this.thumb.size = { width: `calc(${this.domTrack.style.width} - 2 * ${this.thumb.domComponent.style.left})`, height: '0' }
    this.domInformant.style.width = `calc(100% - ${this.domTrack.style.width})`
    this.domInformant.style.height = '100%'
    this.domInformant.innerHTML = `<svg style="width:100%;height:100%;" viewbox="0 0 100 45"><text class="${this.constructor.lazyCSS}Text" x="50%" y="62.5%"/></svg>`
    this.domText = this.domInformant.children[0].children[0]
  }

  getVisible () {
    return this._visible
  }

  setVisible (value) {
    if (this._visible !== value) {
      this._visible = value
      if (this._visible) {
        this.domComponent.style.opacity = 1
      } else {
        this.domComponent.style.opacity = 0
      }
    }
  }

  updateLayer () {
    if (!this.scrolling) {
      this.scrolling = true
      setTimeout(() => {
        if (this.onScroll) this.onScroll(this)
        this.scrolling = false
      }, 25)
    }
  }

  onScrollStart (value) {
    this.domInformant.style.opacity = 1
    this.thumbMove(value.pageY)
  }

  onScrollEnd (value) {
    this.domInformant.style.opacity = 0
    this.thumbMove(value.pageY)
    this.scrolling = false
    if (this.onScroll) this.onScroll(this)
  }

  onScrollMove (value) {
    this.thumbMove(value.pageY)
    this.updateLayer()
  }

  thumbMove (pos) {
    const rect = this.domTrack.getBoundingClientRect()
    const rectThumb = this.thumb.domComponent.getBoundingClientRect()
    pos -= 16
    pos = clamp(pos, rect.top, rect.bottom - rectThumb.height)
    this.ratio = (pos - rect.top) / (rect.height - rectThumb.height) * 100
    this.thumb.domComponent.style.top = `${(pos - rect.top) / rect.height * 100}%`
    this.domText.textContent = `${Math.round(this.ratio)}%`
  }

  thumbUpdate (value) {
    const rect = this.domTrack.getBoundingClientRect()
    const rectThumb = this.thumb.domComponent.getBoundingClientRect()
    this.ratio = value * 100
    this.thumb.domComponent.style.top = `${(rect.height - rectThumb.height) / rect.height * this.ratio}%`
  }
}
