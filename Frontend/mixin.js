export const MixinConstructors = Symbol('Symbol.mixinConstructors')
export const PropertyObservers = Symbol('Symbol.mixinObservers')

class ObservableProperty {
  constructor(value) {
    this.observers = new Set()
    this._value = value
  }

  get value() {
    return this._value
  }

  set value(value) {
    this._value = value
    this.notify(value)
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

export class MixinComponent {
  constructor() {
    if (this.constructor[MixinConstructors] !== undefined)
      this.constructor[MixinConstructors].forEach((mixin) => {
        mixin(this)
      })
  }
}

export function createMixinComponent(...mixins) {
  return ((type) => {
    mixins.forEach((mixin) => {
      mixin(type)
    })
    return type
  })(class extends MixinComponent {})
}

function createObservableProperty(propertyName, fn, defaultValue) {
  if (fn) {
    return function (type) {
      if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
      type[MixinConstructors].push((instance) => {
        if (instance[PropertyObservers] === undefined)
          instance[PropertyObservers] = {}
        instance[PropertyObservers][propertyName] = new ObservableProperty(
          defaultValue
        )
      })
      Object.defineProperty(type.prototype, propertyName, {
        get() {
          return this[PropertyObservers][propertyName].value
        },
        set(value) {
          if (this[PropertyObservers][propertyName].value !== value) {
            fn(this, value)
            this[PropertyObservers][propertyName].value = value
          }
        },
      })
    }
  } else {
    return function (type) {
      if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
      type[MixinConstructors].push((instance) => {
        if (instance[PropertyObservers] === undefined)
          instance[PropertyObservers] = {}
        instance[PropertyObservers][propertyName] = new ObservableProperty(
          defaultValue
        )
      })
      Object.defineProperty(type.prototype, propertyName, {
        get() {
          return this[PropertyObservers][propertyName].value
        },
        set(value) {
          if (this[PropertyObservers][propertyName].value !== value) {
            this[PropertyObservers][propertyName].value = value
          }
        },
      })
    }
  }
}

export const ObservablePropertyTextContent = createObservableProperty(
  'textContent',
  function (instance, value) {
    instance.domComponent.textContent = value
  }
)

export const ObservablePropertyFontSize = createObservableProperty(
  'fontSize',
  function (instance, value) {
    instance.domComponent.style.fontSize = value
  }
)

export const ObservablePropertyVisible = createObservableProperty(
  'visible',
  function (instance, value) {
    instance.domComponent.classList[value === true ? 'remove' : 'add']('hidden')
  },
  true
)

export const ObservablePropertySelectedRow = createObservableProperty(
  'selectedRow',
  function (instance, value) {
    if (instance[PropertyObservers].selectedRow.value !== undefined) {
      instance[PropertyObservers].selectedRow.value.selected = false
    }
    if (value !== undefined) value.selected = true
  }
)

export function PropertyPosition(type) {
  if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
  type[MixinConstructors].push((instance) => {
    instance._position = {}
  })
  Object.defineProperty(type.prototype, 'position', {
    get() {
      return this._position
    },
    set(value) {
      if (value.x !== undefined && this._position.x !== value.x) {
        this.domComponent.style.left = value.x
        this._position.x = this.domComponent.style.left
      }
      if (value.y !== undefined && this._position.y !== value.y) {
        this.domComponent.style.top = value.y
        this._position.y = this.domComponent.style.top
      }
    },
  })
}

export function PropertyVisible(type) {
  if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
  type[MixinConstructors].push((instance) => {
    instance._visible = true
  })
  Object.defineProperty(type.prototype, 'visible', {
    get() {
      return this._visible
    },
    set(value) {
      if (this._visible !== value) {
        this.domComponent.style.display = value === true ? '' : 'none'
        this._visible = value === true
      }
    },
  })
}

export function PropertyDisabled(type) {
  if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
  type[MixinConstructors].push((instance) => {
    instance._disabled = false
  })
  Object.defineProperty(type.prototype, 'disabled', {
    get() {
      return this._disabled
    },
    set(value) {
      if (this._disabled !== value) {
        this.domComponent.classList[value === true ? 'add' : 'remove'](
          'disabled'
        )
        this._disabled = value === true
      }
    },
  })
}

export function PropertySize(type) {
  if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
  type[MixinConstructors].push((instance) => {
    instance._size = {}
  })
  Object.defineProperty(type.prototype, 'size', {
    get() {
      return this._size
    },
    set(value) {
      if (value.width !== undefined && this._size.width !== value.width) {
        this.domComponent.style.width = value.width
        this._size.width = this.domComponent.style.width
      }
      if (value.height !== undefined && this._size.height !== value.height) {
        this.domComponent.style.height = value.height
        this._size.height = this.domComponent.style.height
      }
    },
  })
}

export function Scrollable(type) {
  if (type[MixinConstructors] === undefined) type[MixinConstructors] = []
  type[MixinConstructors].push((instance) => {
    instance.mouseDownDelegate = (event) => instance.mouseDown(event)
    instance.mouseUpDelegate = (event) => instance.mouseUp(event)
    instance.mouseMoveDelegate = (event) => instance.mouseMove(event)
    instance.touchStartDelegate = (event) => instance.touchStart(event)
    instance.touchEndDelegate = (event) => instance.touchEnd(event)
    instance.touchMoveDelegate = (event) => instance.touchMove(event)
  })

  type.prototype.mouseDown = function (event) {
    // event.preventDefault()
    event.stopPropagation()
    this.domScrollTarget.removeEventListener(
      'mousedown',
      this.mouseDownDelegate
    )
    window.addEventListener('mousemove', this.mouseMoveDelegate)
    window.addEventListener('mouseup', this.mouseUpDelegate)
    if (this.onScrollStart) this.onScrollStart(event)
  }

  type.prototype.mouseUp = function (event) {
    event.preventDefault()
    event.stopPropagation()
    window.removeEventListener('mousemove', this.mouseMoveDelegate)
    window.removeEventListener('mouseup', this.mouseUpDelegate)
    this.domScrollTarget.addEventListener('mousedown', this.mouseDownDelegate)
    this.onScrollEnd(event)
  }

  type.prototype.mouseMove = function (event) {
    event.preventDefault()
    event.stopPropagation()
    this.onScrollMove(event)
  }

  type.prototype.touchStart = function (event) {
    // event.preventDefault()
    event.stopPropagation()
    this.domScrollTarget.removeEventListener(
      'touchstart',
      this.touchStartDelegate
    )
    window.addEventListener('touchmove', this.touchMoveDelegate)
    window.addEventListener('touchend', this.touchEndDelegate)
    if (this.onScrollStart) this.onScrollStart(event.changedTouches[0])
  }

  type.prototype.touchEnd = function (event) {
    event.preventDefault()
    event.stopPropagation()
    window.removeEventListener('touchmove', this.touchMoveDelegate)
    window.removeEventListener('touchend', this.touchEndDelegate)
    this.domScrollTarget.addEventListener('touchstart', this.touchStartDelegate)
    this.onScrollEnd(event.changedTouches[0])
  }

  type.prototype.touchMove = function (event) {
    event.stopPropagation()
    this.onScrollMove(event.changedTouches[0])
  }

  type.prototype.bindScrollEvents = function (target) {
    this.domScrollTarget = target
    this.domScrollTarget.addEventListener('mousedown', this.mouseDownDelegate, {
      passive: true,
    })
    this.domScrollTarget.addEventListener(
      'touchstart',
      this.touchStartDelegate,
      { passive: true }
    )
  }
}

// function MixinConstructor (...arguments_) {
//   return function () {
//     arguments_.forEach(argument => {
//       argument.call(this)
//     })
//   }
// }

// function createProperty (name, fn) {
//   const property = function () {}
//   Object.defineProperty(property.prototype, name, {
//     get () { return this[`_${name}`] },
//     set (value) {
//       if (this[`_${name}`] !== value) {
//         this[`_${name}`] = value
//       }
//     }
//   })
// }

export const PropertyHeight = {
  get height() {
    return this._height
  },
  set height(value) {
    if (this._height !== value) {
      this._height = value
    }
  },
}

export const PropertyWidth = {
  get width() {
    return this._width
  },
  set width(value) {
    if (this._width !== value) {
      this._width = value
    }
  },
}

export const MixinVisible = {
  get visible() {
    return this._visible
  },
  set visible(value) {
    if (this._visible !== value) {
      this.domComponent.classList[value === true ? 'remove' : 'add']('hidden')
      this._visible = value
      this.resize()
    }
  },
}

export function Component() {}

// function addProperties (Base, ...properties) {
//   const Type = function (...arguments_) { Base.call(this, arguments_) }
//   Type.prototype = Object.create(Base.prototype, Object.assign({}, ...properties.map(function (property) { return Object.getOwnPropertyDescriptors(property) })))
//   Type.prototype.constructor = Component
//   return Type
// }

export function mixin(instance, ...properties) {
  Object.defineProperties(
    instance,
    ...properties.map(function (property) {
      return Object.getOwnPropertyDescriptors(property)
    })
  )
  return instance
}
