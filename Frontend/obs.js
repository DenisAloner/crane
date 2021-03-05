// const Observer2 = {
//   next (value) { console.log(`observer 2:${value}`) },
//   error (error) { console.log(`error: ${error}`) },
//   end (data) { console.log(data) }
// }

function Observer () {}
Observer.prototype.next = function (value) {}
Observer.prototype.error = function (error) {}
Observer.prototype.end = function () {}

function PropertyObserver (target, property) {
  this.target = target
  this.property = property
}
PropertyObserver.prototype = Object.create(PropertyObserver.prototype)
PropertyObserver.prototype.constructor = PropertyObserver
PropertyObserver.prototype.next = function (value) {
  if (!value.refs.includes(this.target)) {
    this.target.observers.forEach(observer => {
      observer.next({
        type: value.type,
        path: [this.property].concat(value.path),
        value: value.value,
        refs: [this.target].concat(value.refs)
      })
    })
  }
}

function Observable (fn) {
  if (fn) {
    this.subscribe = fn
  }
}
Observable.prototype.subscribe = function (observer) {}
Observable.prototype.unsubscribe = function (observer) {}

function SharedObservable () {
  this.observers = new Set()
}
SharedObservable.prototype.subscribe = function (observer) {
  this.observers.add(observer)
  return () => { this.unsubscribe(observer) }
}
SharedObservable.prototype.unsubscribe = function (observer) {
  this.observers.delete(observer)
}

// function IntervalObservable () {
//   Observable.call(this)
//   console.log('Create')
//   this.counts = 0
//   this.intervalId = setInterval(() => {
//     this.counts++
//     this.observers.forEach(observer => {
//       observer.next(this.counts)
//     })
//     console.log('I am working!')
//   }, 100)
// }
// IntervalObservable.prototype = Object.create(Observable.prototype)
// IntervalObservable.prototype.constructor = IntervalObservable
// IntervalObservable.prototype.unsubscribe = function (observer) {
//   this.observers.delete(observer)
//   if (this.observers.size === 0) { clearInterval(this.intervalId) }
// }

// IntervalObservable.prototype.subscribe = function (observer) {
//   this.observers.add(observer)
//   return () => { this.unsubscribe(observer) }
// }

function ObservableObject () {
  this.replies = {}
  SharedObservable.call(this)
  return new Proxy(this, {
    set (object, property, value) {
      if (typeof value === 'object') {
        let propertyObserver
        if (!object.replies[property]) {
          object.replies[property] = new PropertyObserver(object, property)
        }
        propertyObserver = object.replies[property]
        if (object[property]) {
          object[property].unsubscribe(propertyObserver)
        }
        if (value !== null) {
          value.subscribe(propertyObserver)
        }
      }
      if (Reflect.set(object, property, value)) {
        object.observers.forEach(observer => {
          observer.next({ type: 'set', path: [property], value, refs: [this] })
        })
        return true
      }
      return false
    }
  })
}

// function map (fn) {
//   let observable = new Observable()
//   observable.subscribe = (observer) => {
//     this.subscribe({ next (value) { observer.next(fn(value)) } })
//   }
//   return observable
// }

// function path (...path) {
//   let observable = new Observable()
//   observable.subscribe = (observer) => {
//     const next = (value) => {
//       if (path.length > value.path.length) return observer.end()
//       for (let i = 0; i < path.length; i++) {
//         if (path[i] !== value.path[i]) return observer.end()
//       }
//       return observer.next(value)
//     }
//     console.log(this)
//     this.subscribe({ next })
//   }
//   return observable
// }

// const equal = value => source => new Observable(observer => {
//   return source.subscribe({
//     next (x) { if (x.path[0] === value) observer.next(x) },
//     error (e) { observer.error(e) },
//     end () { observer.end() }
//   })
// })

const path = (...path) => source => new Observable(observer => {
  return source.subscribe({
    next (value) {
      if (path.length !== value.path.length) return observer.end()
      for (let i = 0; i < path.length; i++) {
        if (path[i] !== value.path[i]) return observer.end()
      }
      return observer.next(value)
    },
    error (e) { observer.error(e) },
    end () { observer.end() }
  })
})

ObservableObject.prototype = Object.create(SharedObservable.prototype)
ObservableObject.prototype.constructor = ObservableObject
ObservableObject.prototype.pipe = function (...fns) {
  return fns.reduce((prev, fn) => fn(prev), this)
}

let a = new ObservableObject()
let b = new ObservableObject()
a.b = b

let reply = a.pipe(path('b', 'test')).subscribe({
  next (value) {
    document.querySelector('#reactive').innerHTML = value.value
  },
  error (error) { throw new Error(`error: ${error}`) },
  end () { console.log('end') }
})

// let reply = o.path('test').subscribe({
//   next (value) {
//     document.querySelector('#reactive').innerHTML = value.value
//   },
//   error (error) { throw new Error(`error: ${error}`) },
//   end () {}
// })

b.test = 'This element is reactive!'
window.__sandbox__ = a

// let unscribe2 = timer.subscribe(Observer2)
