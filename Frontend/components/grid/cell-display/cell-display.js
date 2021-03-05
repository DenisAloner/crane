const LOAD_MESSAGE = '...Загрузка...'

export class CellDisplay {
  constructor (owner) {
    this.owner = owner
  }

  init () {
    if (this.create) return
    this.create = true
    this.domComponent = document.createElement('span')
    this.domComponent.className = 'cellEditor_Span'
    this.owner.domComponent.append(this.domComponent)
    this.initValue()
  }

  initValue () {
    this.value = this.owner.value
  }

  getHandler () {
    return value => {
      if (!this.create) return
      const accessor = this.owner.getBinder()
      if (accessor && accessor.comparePath(value.path)) {
        this.value = this.owner.value
        clearTimeout(this.timerId)
        this.owner.block = false
      }
    }
  }

  get value () {
    return this.domComponent.textContent
  }

  set value (value) {
    if (this.create) {
      switch (typeof value) {
        case 'string':
          this.domComponent.textContent = value || ''
          break
        case 'number':
          this.domComponent.textContent = value
          break
        case 'symbol':
          this.domComponent.textContent = value.description
          break
        case 'object':
          if (value instanceof Promise) {
            this.domComponent.textContent = LOAD_MESSAGE
          } else {
            this.domComponent.textContent = value || ''
          }
          break
        default:
          this.domComponent.textContent = ''
          break
      }
    }
  }
}

export function defaultCellDisplay (owner) { return new CellDisplay(owner) }
