import {
  OBSERVABLE_ADD_PROPERTY,
  OBSERVABLE_REMOVE_PROPERTY,
  ObservableObject,
  OBSERVABLE_SET_PROPERTY,
} from './observable.js'
import { filterAlwaysTrue } from './components/grid/cell-editor/cell-editor-list.js'
import { isDeferred } from './api.js'

let listId = 0

export class ListViewItem {
  constructor(item, owner) {
    this.owner = owner
    this.item = item
    this._visible = true
    this.item.subscribe(this.update.bind(this))
  }

  static getIdByDataset(datasetId) {
    return datasetId
  }

  getValue() {
    return this.item
  }

  getDatasetId() {
    return this.item.id
  }

  create() {
    if (this.domComponent === undefined) {
      this.domComponent = document.createElement('div')
      this.domComponent.dataset.id = this.getDatasetId()
      const value = this.value
      this.domComponent.textContent = isDeferred(value) ? 'ЗАГРУЗКА' : value
      this.domComponent.style.top = `${this._top}px`
      if (this._visible) {
        this.owner.throttleInvalidate()
      } else {
        this.domComponent.classList.add('hidden')
      }
      this.owner.domComponent.append(this.domComponent)
    }
  }

  get visible() {
    return this._visible
  }

  set visible(value) {
    value = value === true
    if (this._visible !== value) {
      this._visible = value
      if (this.domComponent) {
        this.domComponent.classList[value ? 'remove' : 'add']('hidden')
      }
      this.owner.throttleInvalidate()
    }
  }

  get top() {
    return this._top
  }

  set top(value) {
    if (this._top !== value) {
      this._top = value
      if (this.domComponent) {
        this.domComponent.style.top = `${this._top}px`
      }
      this.owner.throttleInvalidate()
    }
  }

  update(message) {}

  get value() {}
}

const debounce = (fn, time, context) => {
  let trigger = false
  let period = performance.now()
  setInterval(() => {
    if (trigger && performance.now() - period > time) {
      fn.call(context)
      trigger = false
    }
  }, time)
  return function () {
    trigger = true
    period = performance.now()
  }
}

function throttle(func, ms) {
  let isThrottled = false
  let savedArguments
  let savedThis

  function wrapper() {
    if (isThrottled) {
      // (2)
      savedArguments = arguments
      savedThis = this
      return
    }

    Reflect.apply(func, this, arguments) // (1)

    isThrottled = true

    setTimeout(function () {
      isThrottled = false // (3)
      if (savedArguments) {
        wrapper.apply(savedThis, savedArguments)
        savedArguments = savedThis = null
      }
    }, ms)
  }

  return wrapper
}

export class ListView {
  constructor(owner, map, TypeItem) {
    this.itemSize = 26
    // this.invalidate = debounce(this.invalidate, 16, this)
    this.throttleInvalidate = throttle(this.invalidate.bind(this), 0)
    this.map = map
    this.TypeItem = TypeItem
    this.options = new Map()
    this.domComponent = document.createElement('div')
    this.domComponent.className = 'list-view'
    this.domComponent.id = `datalist${listId}`
    listId += 1
    this.filler = document.createElement('div')
    this.filler.className = 'list-view-mock'
    this.domComponent.append(this.filler)
    owner.domComponent.append(this.domComponent)
    this.props = new ObservableObject()
    this.props.subscribe(this.propsUpdate.bind(this))
    this.props.filter = filterAlwaysTrue
    map.forEach((item) => {
      this.add(item)
    })
    map.subscribe(this.onMessage.bind(this))
    this.delegateScroll = this.invalidate.bind(this)
    this.domComponent.addEventListener('scroll', this.delegateScroll)
    this.previousScrollX = 0
    this.mountedItems = new Set()
    this._height = 0
    this._fillerHeight = 0
  }

  get height() {
    return this._height
  }

  set height(value) {
    if (this._height !== value) {
      this.domComponent.style.height = `${value}px`
      this._height = value
    }
  }

  get fillerHeight() {
    return this._fillerHeight
  }

  set fillerHeight(value) {
    if (this._fillerHeight !== value) {
      this.filler.style.height = `${value}px`
      this._fillerHeight = value
    }
  }

  propsUpdate(message) {
    switch (message.type) {
      case OBSERVABLE_ADD_PROPERTY:
        break
      case OBSERVABLE_SET_PROPERTY:
        if (message.path.length === 1 && message.path[0] === 'filter') {
          this.options.forEach(function (option) {
            option.visible = message.value(option)
          })
        }
        break
    }
  }

  invalidate() {
    if (
      this.currentOwner !== undefined &&
      document.body.contains(this.domComponent)
    ) {
      const scrollX = this.domComponent.scrollLeft
      const scrollY = this.domComponent.scrollTop
      if (this.previousScrollX !== scrollX) {
        this.previousScrollX = scrollX
        return
      }
      let visibleRowsCount = 0
      this.options.forEach((option) => {
        if (option.visible) visibleRowsCount += 1
      })
      const height = this.itemSize * visibleRowsCount
      const rectOwner = this.currentOwner.rectOwner
      const availableHeight =
        window.innerHeight - rectOwner.top - rectOwner.height
      const componentHeight = Math.min(height, availableHeight)
      let visibleHeight = 0
      const iterator = this.options.values()
      let current = iterator.next()
      let option
      this.addedItems = new Set()
      this.newItems = []
      while (!current.done) {
        option = current.value
        if (option.visible) {
          visibleHeight += this.itemSize
          if (visibleHeight > scrollY) {
            if (option.domComponent === undefined) option.create()
            option.top = visibleHeight - this.itemSize
            this.addedItems.add(option.domComponent)
            if (!this.mountedItems.has(option.domComponent))
              this.newItems.push(option.domComponent)
          }
          if (visibleHeight - scrollY >= componentHeight) break
        }
        current = iterator.next()
      }
      [...this.mountedItems]
        .filter((x) => {
          return !this.addedItems.has(x)
        })
        .forEach((x) => {
          if (x !== this.filler) x.remove()
        })
      const fragment = document.createDocumentFragment()
      this.newItems.forEach(function (x) {
        return fragment.append(x)
      })
      this.domComponent.append(fragment)
      this.mountedItems = this.addedItems
      if (
        height < availableHeight &&
        this.domComponent.scrollWidth > this.domComponent.clientWidth
      ) {
        this.height = componentHeight + 17
      } else {
        this.height = componentHeight
      }
      this.fillerHeight = height
    }
  }

  getValue(datasetId) {
    const value = this.options.get(this.TypeItem.getIdByDataset(datasetId))
    return value !== undefined ? value.getValue() : undefined
  }

  add(item) {
    if (!this.options.has(item.id)) {
      const option = new this.TypeItem(item, this)
      option.visible = this.props.filter(option)
      this.options.set(option.item.id, option)
    }
  }

  remove(key) {
    const item = this.options.get(key)
    if (item) {
      this.options.delete(key)
      if (item.domComponent !== undefined) {
        item.domComponent.remove()
        this.throttleInvalidate()
      }
    }
  }

  onMessage(message) {
    switch (message.type) {
      case OBSERVABLE_ADD_PROPERTY:
        if (message.path.length === 1) {
          this.add(message.value)
        }
        break
      case OBSERVABLE_REMOVE_PROPERTY:
        if (message.path.length === 1) {
          this.remove(message.path[0])
        }
        break
      default:
        break
    }
  }
}
