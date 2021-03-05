import { CellDisplay } from './cell-display.js'
import { isDeferred } from '../../../api.js'

function addZero (value) {
  return `${value}`.padStart(2, '0')
}

function formatDatetime (value) {
  return `${addZero(value.getUTCDate())}.${addZero(value.getUTCMonth() + 1)}.${addZero(value.getUTCFullYear())} ${addZero(value.getUTCHours())}:${addZero(value.getUTCMinutes())}`
}

export class CellDisplayDatetime extends CellDisplay {
  get value () {
    return this.domComponent.textContent
  }

  set value (value) {
    if (this.create) {
      if (isDeferred(value)) {
        this.domComponent.textContent = 'Загрузка'
      } else {
        this.domComponent.textContent = formatDatetime(new Date(new Date(value).getTime() - new Date().getTimezoneOffset() * 60 * 1000))
      }
    }
  }
}
