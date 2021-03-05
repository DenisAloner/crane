import { CellDisplay } from './cell-display.js'
import { isDeferred, partialMatch } from '../../../api.js'

export class CellDisplayOption extends CellDisplay {
  getHandler () {
    return message => {
      if (!this.create) return
      const binder = this.owner.getBinder()
      if (binder) {
        if (binder.comparePath(message.path)) {
          this.value = this.owner.value
          clearTimeout(this.timerId)
          this.owner.block = false
        } else {
          if (message.path.length > binder.path.length) {
            for (var i = 0; i < binder.path.length; i++) {
              if (message.path[i] !== binder.path[i]) return
            }
            if (this.create) {
              const property = message.path.slice(binder.path.length)
              for (let index = 0; index < binder.properties.length; index++) {
                if (partialMatch(property, binder.properties[index])) {
                  this.value = this.owner.value
                  clearTimeout(this.timerId)
                  this.owner.block = false
                  break
                }
              }
            }
          }
        }
      }
    }
  }

  get value () {
    return this.domComponent.textContent
  }

  set value (value) {
    super.value = !isDeferred(value) && value !== undefined ? this.owner.getBinder().list.options.get(value.id).value : undefined
  }
}

export function defaultCellDisplayOption (owner) { return new CellDisplayOption(owner) }

export class CellDisplayListItem extends CellDisplay {
  getHandler () {
    return message => {
      if (!this.create) return
      const binder = this.owner.getBinder()
      if (binder) {
        if (binder.comparePath(message.path)) {
          this.value = this.owner.value
          clearTimeout(this.timerId)
          this.owner.block = false
        } else {
          if (message.path.length === binder.path.length + 1) {
            for (var i = 0; i < binder.path.length; i++) {
              if (message.path[i] !== binder.path[i]) return
            }
            if (this.create) {
              const property = message.path.slice(binder.path.length)
              for (let index = 0; index < binder.properties.length; index++) {
                if (partialMatch(property, binder.properties[index])) {
                  this.value = this.owner.value
                  clearTimeout(this.timerId)
                  this.owner.block = false
                  break
                }
              }
            }
          }
        }
      }
    }
  }

  get value () {
    return this.domComponent.textContent
  }

  set value (value) {
    super.value = !isDeferred(value) && value !== undefined ? this.owner.getBinder().list.options.get(value).value : undefined
  }
}

export function defaultCellDisplayListItem (owner) { return new CellDisplayListItem(owner) }
