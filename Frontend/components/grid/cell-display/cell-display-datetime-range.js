import { CellDisplay } from './cell-display.js'

function addZero (value) {
  return `${value}`.padStart(2, '0')
}

function formatDatetime (value) {
  return `${addZero(value.getUTCDate())}.${addZero(value.getUTCMonth() + 1)}.${addZero(value.getUTCFullYear())} ${addZero(value.getUTCHours())}:${addZero(value.getUTCMinutes())}`
}

export class CellDisplayDatatimeRange extends CellDisplay {
  get value () {
    return this.domComponent.textContent
  }

  set value (value) {
    if (this.create) this.domComponent.textContent = (value !== undefined) ? `${formatDatetime(value.start)} по ${formatDatetime(value.end)}` : ''
  }
}
