export const OBSERVABLE_ADD_PROPERTY = Symbol('Add')
export const OBSERVABLE_SET_PROPERTY = Symbol('Set')
export const OBSERVABLE_REMOVE_PROPERTY = Symbol('Remove')

export const TYPE = Symbol('Type')
export const SCALAR = Symbol('Scalar')

const OBSERVABLE = Symbol('Observable')

const Observable = (Base = Object) =>
  class extends Base {
    constructor() {
      super()
      this[OBSERVABLE] = true
      this.observers = new Set()
    }

    subscribe(fn) {
      this.observers.add(fn)
      return () => {
        this.unsubscribe(fn)
      }
    }

    unsubscribe(fn) {
      this.observers.delete(fn)
    }

    notify(value) {
      this.observers.forEach((fn) => {
        fn(value)
      })
    }
  }

export class ObservableObject extends Observable() {
  constructor(id) {
    super()
    this.replies = {}
    if (id) this.id = id
    return new Proxy(this, {
      set(target, property, value) {
        const currentValue = target[property]
        if (currentValue === value) {
          return true
        }
        if (typeof value === 'object' && value !== null && value[OBSERVABLE]) {
          let propertyObserver = target.replies[property]
          if (propertyObserver) {
            currentValue.unsubscribe(propertyObserver)
          } else {
            propertyObserver = (value) => target.nestedHandle(property, value)
            target.replies[property] = propertyObserver
          }
          value.subscribe(propertyObserver)
        } else {
          const propertyObserver = target.replies[property]
          if (propertyObserver) {
            currentValue.unsubscribe(propertyObserver)
          }
          target.replies[property] = undefined
        }
        if (Reflect.set(target, property, value)) {
          if (value === undefined) {
            target.notify({
              type: OBSERVABLE_REMOVE_PROPERTY,
              path: [property],
              refs: [target],
            })
          } else {
            target.notify({
              type: OBSERVABLE_SET_PROPERTY,
              path: [property],
              value,
              refs: [target],
            })
          }
          return true
        }
        return false
      },
    })
  }

  nestedHandle(key, value) {
    if (!value.refs.includes(this)) {
      if (value.type === OBSERVABLE_REMOVE_PROPERTY) {
        this.notify({
          type: value.type,
          path: [key].concat(value.path),
          refs: [this].concat(value.refs),
        })
      } else {
        this.notify({
          type: value.type,
          path: [key].concat(value.path),
          value: value.value,
          refs: [this].concat(value.refs),
        })
      }
    }
  }

  getAccessor(...path) {
    return new Accessor(this, ...path)
  }

  set(key, value) {
    this[key] = value
  }

  get(key) {
    return this[key]
  }
}

export class ObservableMap extends Observable(Map) {
  constructor() {
    super()
    this.replies = new Map()
  }

  set(key, value) {
    if (super.get(key) !== value) {
      if (value !== undefined) {
        if (typeof value === 'object') {
          let propertyObserver = this.replies.get(key)
          if (!propertyObserver) {
            propertyObserver = (value) => this.nestedHandle(key, value)
            this.replies.set(key, propertyObserver)
          }
          if (super.get(key)) {
            super.get(key).unsubscribe(propertyObserver)
          }
          if (value !== null) {
            value.subscribe(propertyObserver)
          }
        }
        super.set(key, value)
        this.notify({
          type: OBSERVABLE_ADD_PROPERTY,
          path: [key],
          value,
          refs: [this],
        })
      } else {
        this.delete(key)
      }
    }
  }

  get(key) {
    return super.get(key)
  }

  delete(key) {
    const value = super.get(key)
    if (typeof value === 'object' && value !== null) {
      super.get(key).unsubscribe(this.replies.get(key))
      this.replies.delete(key)
    }
    if (super.delete(key)) {
      this.notify({
        type: OBSERVABLE_REMOVE_PROPERTY,
        path: [key],
        refs: [this],
      })
      return true
    }
    return false
  }

  clear() {
    this.forEach((value, key) => {
      if (typeof value === 'object' && value !== null) {
        super.get(key).unsubscribe(this.replies.get(key))
        this.replies.delete(key)
      }
      super.delete(key)
      this.notify({
        type: OBSERVABLE_REMOVE_PROPERTY,
        path: [key],
        refs: [this],
      })
    })
  }

  nestedHandle(key, value) {
    if (!value.refs.includes(this)) {
      if (value.type === OBSERVABLE_REMOVE_PROPERTY) {
        this.notify({
          type: value.type,
          path: [key].concat(value.path),
          refs: [this].concat(value.refs),
        })
      } else {
        this.notify({
          type: value.type,
          path: [key].concat(value.path),
          value: value.value,
          refs: [this].concat(value.refs),
        })
      }
    }
  }

  some(fn) {
    for (const element of super.values()) {
      if (fn(element)) {
        return true
      }
    }
    return false
  }
}

export class ObservableSet extends Observable(Set) {
  constructor() {
    super()
    this.replies = new Set()
  }

  set(value) {
    if (super.has(value) !== value) {
      super.add(value)
      this.notify({
        type: OBSERVABLE_ADD_PROPERTY,
        path: [value],
        value,
        refs: [this],
      })
    }
  }

  // get (key) {
  //   return super.get(key)
  // }

  delete(value) {
    if (super.has(value)) {
      super.delete(value)
      this.notify({
        type: OBSERVABLE_REMOVE_PROPERTY,
        path: [value],
        refs: [this],
      })
    }
  }

  [Symbol.iterator]() {
    return super[Symbol.iterator]()
  }
}

export class ObservableArray extends Observable(Array) {
  constructor() {
    super()
    this.replies = new Set()
  }

  set(value) {
    super.push(value)
    this.notify({
      type: OBSERVABLE_ADD_PROPERTY,
      path: [value],
      value,
      refs: [this],
    })
  }

  // get (key) {
  //   return super.get(key)
  // }

  delete(value) {
    // if (super.has(value)) {
    //   super.delete(value)
    //   this.notify({ type: OBSERVABLE_REMOVE_PROPERTY, path: [value], self: this })
    // }
  }

  // [Symbol.iterator] () { return super[Symbol.iterator]() }
}

export class Accessor {
  constructor(object, ...path) {
    this.object = object
    this.path = path
  }

  get value() {
    let result = this.object
    for (let index = 0; index < this.path.length; index++) {
      if (result) {
        result = result[this.path[index]]
      } else return result
    }
    return result
  }

  getWith(...path) {
    path = this.path.concat(path)
    let result = this.object
    for (const element of path) {
      if (result) {
        result = result[element]
      } else return result
    }
    return result
  }

  set value(value) {
    let result = this.object
    let index
    for (index = 0; index < this.path.length - 1; index++) {
      if (result) {
        result = result[this.path[index]]
      } else return
    }
    result[this.path[index]] = value
  }

  comparePath(path) {
    if (path.length > this.path.length) return false
    for (const [i, element] of path.entries()) {
      if (element !== this.path[i]) return false
    }
    return true
  }
}
