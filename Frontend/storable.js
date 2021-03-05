import { ObservableMap } from './observable.js'
import { Core } from './api.js'
import { $ARGUMENTS, STORED } from './graph-ql/gql-constants.js'
import { Store } from './store.js'

export function InitStorable() {
  Store.shared = {}
  Store.shared.storeableMaps = new Map()
  Store.shared.datalists = new Map()
  Core.getShared = function (
    name,
    wrapped,
    localConstructor,
    insertMutation,
    deleteMutation
  ) {
    let table = Store.shared.storeableMaps.get(name)
    if (table === undefined) {
      table = new StoreableMap(
        wrapped,
        localConstructor,
        insertMutation,
        deleteMutation
      )
      Store.shared.storeableMaps.set(name, table)
    }
    return table
  }
}

export class StoreableMap extends ObservableMap {
  constructor(wrapped, localConstructor, insertMutation, deleteMutation) {
    super()
    this.wrapped = wrapped
    this.wrapped.subscribe(this.onWrappedMapChange.bind(this))
    this.counter = 0
    this.LocalConstructor = localConstructor
    this.insertMutation = insertMutation
    this.deleteMutation = deleteMutation
  }

  onWrappedMapChange(message) {
    this.notify(message)
  }

  newValue(...values) {
    this.counter += 1
    const id = `_${this.counter}`
    const object = new this.LocalConstructor(id, ...values)
    object[STORED] = false
    super.set(id, object)
    return object
  }

  insertStore(object) {
    if (object[STORED]) return
    const arguments_ = {}
    for (const argument of this.insertMutation.arguments.keys()) {
      const value = object[argument]
      if (typeof value === 'object') {
        arguments_[argument] = value.id
      } else {
        arguments_[argument] = value === undefined ? null : value
      }
    }
    Core.socket.execute(
      { [this.insertMutation.name]: { [$ARGUMENTS]: arguments_ } },
      (data) => {
        if (data === null) return
        for (const element of data) {
          const [request] = Object.entries(element)[0]
          if (request === this.insertMutation.name) {
            super.delete(object.id)
            break
          }
        }
      }
    )
  }

  deleteStore(id) {
    if (!super.delete(id)) {
      Core.socket.execute({
        [this.deleteMutation.name]: { [$ARGUMENTS]: { id } },
      })
    }
  }

  set(id, value) {
    this.wrapped.set(id, value)
  }

  delete(id) {
    if (!super.delete(id)) {
      this.wrapped.delete(id)
    }
  }

  forEach(fn) {
    super.forEach(fn)
    this.wrapped.forEach(fn)
  }

  forEachLocal(fn) {
    super.forEach(fn)
  }

  some(fn) {
    return super.some(fn) || this.wrapped.some(fn)
  }

  someLocal(fn) {
    return super.some(fn)
  }
}
