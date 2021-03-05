window.addEventListener('load', init)

// class CancellationTokenSource {
//   constructor () {
//     this.id = 0
//   }

//   getToken () {
//     return new CancellationToken(this, this.id)
//   }

//   cancel () {
//     this.id++
//   }
// }

// class CancellationToken {
//   constructor (owner, id) {
//     this.id = id
//     this.owner = owner
//   }

//   isCancelled () {
//     return this.owner.id !== this.id
//   }
// }

// function filter (token) {
//   return new Promise(function (resolve, reject) {
//     let i = 0
//     const id = setInterval(() => {
//       if (token.isCancelled()) return reject(new Error('Cancelled'))
//       if (i > 10) {
//         clearInterval(id)
//         resolve()
//         return
//       }
//       console.log(`filter ${i}`)
//       i++
//     }, 50)
//   })
// }

// function sort (token) {
//   return new Promise(function (resolve, reject) {
//     let i = 0
//     const id = setInterval(() => {
//       if (token.isCancelled()) return reject(new Error('Cancelled'))
//       if (i > 10) {
//         clearInterval(id)
//         resolve()
//         return
//       }
//       console.log(`sort ${i}`)
//       i++
//     }, 50)
//   })
// }

// async function handle (token) {
//   await filter(token)
//   await sort(token)
// }

// const cts = new CancellationTokenSource()
// let previousFn

// async function task (taskId) {
//   cts.cancel()
//   const token = cts.getToken()
//   await previousFn
//   if (token.isCancelled()) return
//   previousFn = (async () => {
//     try {
//       console.log(taskId)
//       await handle(token)
//     } catch (error) {
//       console.log(error)
//     }
//   })()
// }

const OBSERVABLE = Symbol('Observable')

function Observable () {
  this[OBSERVABLE] = true
  this.observers = new Set()
}

Observable.prototype.subscribe = function (fn) {
  this.observers.add(fn)
  return () => { this.unsubscribe(fn) }
}

Observable.prototype.unsubscribe = function (fn) {
  this.observers.delete(fn)
}

Observable.prototype.notify = function (value) {
  this.observers.forEach(fn => { fn(value) })
}

Observable.prototype.nestedHandler = function (key, message) {
  if (!message.refs.includes(this)) {
    this.notify({
      value: message.value,
      path: [key].concat(message.path),
      refs: [this].concat(message.refs)
    })
  }
}

class ObservableObject extends Observable {
  constructor (id) {
    super()
    this.nestedHandlers = {}
    if (id) this.id = id
    return new Proxy(this, {
      set (target, property, value) {
        const currentValue = target[property]
        if (currentValue === value) { return true }
        if (typeof value === 'object' && value !== null && value[OBSERVABLE]) {
          let nestedHandler = target.nestedHandlers[property]
          if (nestedHandler !== undefined) {
            currentValue.unsubscribe(nestedHandler)
          } else {
            nestedHandler = value => target.nestedHandler(property, value)
            target.nestedHandlers[property] = nestedHandler
          }
          value.subscribe(nestedHandler)
        } else {
          const nestedHandler = target.nestedHandlers[property]
          if (nestedHandler !== undefined) {
            currentValue.unsubscribe(nestedHandler)
            target.nestedHandlers[property] = undefined
          }
        }
        if (Reflect.set(target, property, value)) {
          target.notify({
            value,
            path: [property],
            refs: [target]
          })
          return true
        }
        return false
      }
    })
  }

  set (key, value) {
    this[key] = value
  }

  get (key) {
    return this[key]
  }
}

class ObservableMap extends Map {
  constructor () {
    super()
    Observable.call(this)
    this.nestedHandlers = new Map()
  }

  get (key) {
    return super.get(key)
  }

  set (key, value) {
    const currentValue = super.get(key)
    if (currentValue === value) { return true }
    if (typeof value === 'object' && value !== null && value[OBSERVABLE]) {
      let nestedHandler = this.nestedHandlers.get(key)
      if (nestedHandler !== undefined) {
        currentValue.unsubscribe(nestedHandler)
      } else {
        nestedHandler = value => this.nestedHandler(key, value)
        this.nestedHandlers[key] = nestedHandler
      }
      value.subscribe(nestedHandler)
    } else {
      const nestedHandler = this.nestedHandlers.get(key)
      if (nestedHandler !== undefined) {
        currentValue.unsubscribe(nestedHandler)
        this.nestedHandlers.delete(key)
      }
    }
    if (value !== undefined) { super.set(key, value) } else { super.delete(key) }
    this.notify({
      value,
      path: [key],
      refs: [this]
    })
    return true
  }

  delete (key) {
    return this.set(key, undefined)
  }
}

ObservableMap.prototype.subscribe = Observable.prototype.subscribe
ObservableMap.prototype.unsubscribe = Observable.prototype.unsubscribe
ObservableMap.prototype.notify = Observable.prototype.notify

class Binder {
  constructor (target, path, fn) {
    this.target = target
    this.path = path
    this.fn = fn
    this.value = undefined
  }

  handler (message) {
    if (message.path.length > this.path.length) return
    let value = this.target
    let index
    for (index = 0; index < message.path.length; index++) {
      if (this.path[index] === message.path[index]) {
        value = value.get(this.path[index]) // TODO: можно использовать message.refs, чтобы не вычислять значение каждый
      } else return
    }
    for (index; index < this.path.length; index++) {
      if (value != null && typeof value === 'object' && value[OBSERVABLE]) {
        value = value.get(this.path[index])
      } else {
        value = undefined
        break
      }
    }
    if (this.value !== value) {
      this.value = value
      this.fn(value)
    }
  }
}

function init () {
  const rootDiv = document.querySelector('#root')
  const object = new ObservableObject()
  const b = new Binder(object, ['user', 'name'], value => { console.log(`User name: ${value}`) })
  object.subscribe(b.handler.bind(b))
  const user1 = new ObservableObject()
  object.user = user1
  user1.name = 'Tom'
  const user2 = new ObservableObject()
  user2.name = 'Bob'
  object.user = user2
  const user3 = new ObservableObject()
  user3.name = 'Sam'
  object.user = user3
  console.log('-------------------')
  user3.lastName = 'Gats'
  // object.subscribe(console.log)
  // const map = new ObservableMap()
  // map.subscribe(function (message) {
  //   if (message.path.length === 1) {
  //     if (message.value !== undefined) { console.log('add') } else { console.log('remove') }
  //   }
  // })
  // object.map = map
  // map.set('1', new ObservableObject())
  // map.set('1', new ObservableObject())
  // map.delete('1')
}
