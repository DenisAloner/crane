import { CellDisplay } from './cell-display.js'

export const STATUS_FLAGS = {
  ERROR: 1 << 0,
  WARNING: 1 << 1,
  RESET: 1 << 2,
  BUSY: 1 << 3,
  CANCELED: 1 << 4
}

export class CellDisplayStatus extends CellDisplay {
  get value () {
    return this._value
  }

  set value (value) {
    this._value = value
    if (this.create) {
      let text
      const extraText = []
      if (value & STATUS_FLAGS.RESET) {
        text = 'Сброс'
      } else {
        if (value & STATUS_FLAGS.ERROR) {
          text = 'Сбой'
        } else if (value & STATUS_FLAGS.BUSY) {
          if (value & STATUS_FLAGS.CANCELED) {
            text = 'Отменяется'
          } else {
            text = 'Выполняется'
          }
        } else {
          text = 'Без задач'
        }
      }
      if (value & STATUS_FLAGS.WARNING) { extraText.push('есть предупреждения') }
      // if (status.safetyLock) { extraText.push('блокировка для защиты персонала') }
      if (extraText.length !== 0) { text += ` (${extraText.join(', ')})` }
      this.domComponent.textContent = text
    }
  }
}
