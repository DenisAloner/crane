import { CellDisplay } from './cell-display.js'

export class CellDisplayCheckBox extends CellDisplay {
  init () {
    if (this.create) return
    this.create = true
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'checkBox_Component buttonComponent firstColor'
    this.domComponent.tabIndex = 0
    this.domIcon = document.createElement('div')
    this.domComponent.append(this.domIcon)
    this.initValue()
    this.owner.domComponent.append(this.domComponent)
  }

  get value () {
    return this._value
  }

  set value (value) {
    this._value = value
    if (this.create) {
      if (value) {
        this.domIcon.className = 'check'
      } else {
        this.domIcon.removeAttribute('class')
      }
    }
  }
}

export function defaultCellDisplayCheckBox (owner) { return new CellDisplayCheckBox(owner) }
