import { CellDisplay } from './cell-display.js'

export class CellDisplayMode extends CellDisplay {
  get value () {
    return this._value
  }

  set value (value) {
    this._value = value
    if (this.create) {
      let text
      switch (value) {
        case 1: text = 'Ручной'
          break
        case 2:text = 'Автоматический'
          break
        default:
          text = 'Неопределен'
          break
      }
      this.domComponent.textContent = text
    }
  }
}
