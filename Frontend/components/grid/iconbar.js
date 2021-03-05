
import { lazyCSS } from '../../lazy-css.js'

export class IconBar {
  constructor () {
    if (this.constructor.lazyCSS === undefined) {
      const rule = name => `${name}{-webkit-mask-image:url('/resources/${name}.svg');-webkit-mask-size:cover;-webkit-mask-repeat:no-repeat;mask-image:url('/resources/${name}.svg');mask-size:cover;mask-repeat:no-repeat}`
      lazyCSS(this.constructor,
        rule('block'),
        rule('error'),
        rule('update'),
        rule('no-edit')
      )
    }
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'grid_CellIconBar'
    this.blockIcon = document.createElement('div')
    this.blockIcon.className = `grid_CellIconBarItem ${this.constructor.lazyCSS}block`
    this.domComponent.append(this.blockIcon)
    this.errorIcon = document.createElement('div')
    this.errorIcon.className = `grid_CellIconBarItem ${this.constructor.lazyCSS}error`
    this.domComponent.append(this.errorIcon)
    this.updateIcon = document.createElement('div')
    this.updateIcon.className = `grid_CellIconBarItem ${this.constructor.lazyCSS}update`
    this.domComponent.append(this.updateIcon)
    this.noEditIcon = document.createElement('div')
    this.noEditIcon.className = `grid_CellIconBarItem ${this.constructor.lazyCSS}no-edit`
    this.domComponent.append(this.noEditIcon)
  }

  showIcon (icon) {
    icon.classList.add('show-icon')
  }

  hideIcon (icon) {
    icon.classList.remove('show-icon')
  }
}
