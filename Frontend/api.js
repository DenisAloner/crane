import { Store } from './store.js'
import { Scheme } from './graph-ql/gql.js'
import { schemeBuild } from './scheme-build.js'
import { Workspace } from './workspace.js'
import { SvgCache } from './svg-cache.js'
import { _, $ARGUMENTS, STORED, DELETE } from './graph-ql/gql-constants.js'
import { Aggregator } from './aggregator.js'

export function partialMatch(left, right) {
  if (left.length > right.length) return false
  for (const [index, element] of left.entries()) {
    if (element !== right[index]) return false
  }
  return true
}

export function smartGet(object, table, path) {
  let result = object
  if (result) {
    for (let index = 0; index < path.length; index++) {
      result = result[path[index]]
      if (result === null) return null
      if (result === undefined) {
        if (object[STORED] === undefined || object[STORED] === false)
          return undefined
        const query = {
          [$ARGUMENTS]: { id: object.id },
        }
        let queryPath = query
        let j = 0
        for (; j < index; j++) {
          queryPath[path[j]] = {}
          queryPath = queryPath[path[j]]
        }
        queryPath[path[j]] = _
        return Core.socket.execute({ [table]: query })
      }
    }
    return result
  } else return undefined
}

export async function getValue(object, table, path) {
  let result = smartGet(object, table, path)
  while (typeof result === 'object' && result instanceof Promise) {
    await result
    result = smartGet(object, table, path)
  }
  return result
}

export function isDeferred(value) {
  return typeof value === 'object' && value instanceof Promise
}

export let XLSX

export const lazyLoadModule = async () => {
  if (XLSX === undefined) {
    XLSX = (await import('./xlsx.mini.min.js')).XLSX
  }
}

export async function exportXlsx(grid, name) {
  const promises = []
  const workbook = XLSX.utils.book_new()
  const data = [[]]
  const exported = []
  grid.columns.forEach((column, index) => {
    if (column.includeExport.value === true) {
      exported.push(true)
      data[0].push(column.label)
      promises.push(grid.view.undeferredColumn(column, index))
    } else exported.push(false)
  })

  if (promises.size !== 0) {
    await Promise.all(promises)
  }

  grid.view.rows.forEach((row) => {
    const cells = []
    row.cell.forEach((cell, i) => {
      if (exported[i] === true) {
        cells.push(cell.column.binder.undeferred(row.tag))
      }
    })
    data.push(cells)
  })

  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, ws, name)
  XLSX.writeFile(workbook, `${name}.xlsx`)
}

class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })
  }
}

// class Deferred extends Promise {
//   constructor () {
//     let _resolve
//     let _reject
//     super((resolve, reject)=>{
//       _resolve = resolve
//       _reject = reject
//     })
//     this.resolve= _resolve
//     this.reject = _reject
//   }
// }

class Socket {
  constructor() {
    this.id = 0
    this.tasks = new Map()
    this.deferreds = new Map()
    this._arguments = []
    this._callbacks = []
    this.timeout = 0
    this.ready = false
    this.instance = undefined
    this.const = this.send.bind(this)
    this.deferred = undefined
    this.period = performance.now()
    setInterval(() => {
      if (
        this.ready === true &&
        this._arguments.length > 0 &&
        performance.now() - this.period > 1
      ) {
        this.const()
      }
    }, 1)
  }

  connect() {
    this.instance = new WebSocket(`wss://${document.location.host}/`, 'chat')
    this.instance.addEventListener('open', () => {
      console.log('WebSocket start')
      this.instance.addEventListener('close', (event) => {
        Core.workspace.modal.fatal(
          'Необходимо перегрузить страницу, так как соединение с сервером было прервано'
        )
      })
      this.instance.addEventListener('error', function (event) {
        console.log(event)
      })
      this.instance.addEventListener('message', (signal) => {
        signal = JSON.parse(signal.data)
        // console.log('%cSIGNAL', 'background: #99DBFF; color: #000000', signal)
        if (signal.data !== undefined) {
          if (signal.data) Scheme.resolve(signal.data)
          const tasks = this.tasks.get(signal.id)
          const deferred = this.deferreds.get(signal.id)
          if (signal.errors) {
            Core.workspace.modal.add(signal.errors[0].error)
          }
          if (tasks) {
            tasks.forEach((task) => {
              task(signal.data)
            })
            this.tasks.delete(signal.id)
          }
          if (deferred) {
            deferred.resolve()
            this.deferreds.delete(signal.id)
          }
        } else if (signal.insert) {
          const table = Store.observables.get(signal.id)
          if (table !== undefined) {
            table.type.resolve({
              id: signal.id,
              [`${signal.insert}`]: { id: `${signal.insert}` },
            })
          }
        } else if (signal.update) {
          const object = Store.observables.get(signal.update[0])
          if (object /* && object[signal.update[1]] !== undefined */) {
            Core.socket.execute({
              [signal.id]: {
                [$ARGUMENTS]: { id: signal.update[0] },
                [signal.update[1]]: _,
              },
            })
          }
        } else if (signal.delete) {
          const table = Store.observables.get(signal.id)
          if (table !== undefined) {
            table.type.resolve({ id: signal.id, [signal.delete]: DELETE })
          }
        } else if (signal.stop) {
          Core.workspace.modal.fatal(signal.stop)
        }
      })
      this.ready = true
      this.execute()
    })
  }

  execute(query, callback) {
    if (this.deferred === undefined) {
      this.deferred = new Deferred()
    }
    if (query !== undefined) {
      if (Array.isArray(query)) {
        let isValid = true
        for (const element of query) {
          const maybeError = Scheme.validate(element)
          if (Scheme.validate(element) !== undefined) {
            console.log(maybeError)
            isValid = false
            break
          }
        }
        if (isValid) {
          Array.prototype.push.apply(this._arguments, query)
          if (callback !== undefined) {
            this._callbacks.push(callback)
          }
        }
      } else {
        const maybeError = Scheme.validate(query)
        if (maybeError === undefined) {
          this._arguments.push(query)
          if (callback !== undefined) {
            this._callbacks.push(callback)
          }
        } else console.log(maybeError)
      }
    }
    this.period = performance.now()
    return this.deferred.promise
  }

  send() {
    const serializedQueries = []
    const combiner = new Aggregator()
    for (let i = 0; i < this._arguments.length; i++) {
      combiner.byFields(this._arguments[i])
    }
    combiner.byArguments()
    for (const [name, map] of combiner.map) {
      const type = Scheme.queries.get(name)
      for (const fields of map.values()) {
        serializedQueries.push(type.serialize(fields))
      }
    }
    this.id += 1
    if (this._callbacks.length !== 0) {
      this.tasks.set(`${this.id}`, this._callbacks)
    }
    this.deferreds.set(`${this.id}`, this.deferred)
    this.deferred = undefined
    this._arguments = []
    this._callbacks = []
    this.instance.send(`${this.id}#${serializedQueries.join(' ')}`)
  }
}

export const Core = new (class {
  constructor() {
    schemeBuild()
    this.socket = new Socket()
  }

  init(target) {
    this.workspace = new Workspace(target)
    this.svgCache = new SvgCache(this)
    this.svgCache.add('expand-up', 'expand-up')
    this.svgCache.add('expand-down', 'expand-down')
    this.svgCache.add('check', 'check')
    this.svgCache.addSVGMask('close', 'close')
    this.svgCache.addSVGMask('chevron_left', 'chevron_left')
    this.svgCache.addSVGMask('chevron_right', 'chevron_right')
  }

  sendRequestHttp(query) {
    if (Scheme.validate(query) !== undefined) return
    const name = Object.keys(query)[0]
    const type = Scheme.queries.get(name)
    const serializedQuery = type.serialize(query[name])
    return new Promise(function (resolve, reject) {
      const request = new XMLHttpRequest()
      request.responseType = 'json'
      request.open('POST', '', true)
      request.setRequestHeader(
        'Content-Type',
        'application/json; charset=utf-8'
      )
      request.setRequestHeader('Accept', 'application/json')
      request.timeout = 400000
      request.ontimeout = () => {
        request.abort()
        reject(
          new AjaxError({
            status: request.status,
            statusText: request.statusText,
          })
        )
      }
      request.withCredentials = true
      request.onreadystatechange = () => {
        if (request.readyState === XMLHttpRequest.DONE) {
          request.ontimeout = () => {}
          if (request.status === 200) {
            if (request.response.errors) {
              reject(new GraphQLError(request.response))
            } else {
              resolve(request.response)
            }
          } else {
            reject(
              new AjaxError({
                status: request.status,
                statusText: request.statusText,
              })
            )
          }
        }
      }
      request.onerror = () => {
        reject(
          new AjaxError({
            status: request.status,
            statusText: request.statusText,
          })
        )
      }
      request.send(serializedQuery)
    })
  }

  getTable(name) {
    let table = Store.observables.get(name)
    if (table === undefined) {
      Scheme.resolve([{ [name]: { id: name } }])
      table = Store.observables.get(name)
    }
    return table
  }
})()

export class GraphQLError extends Error {
  constructor(json, ...arguments_) {
    super(...arguments_)
    this.raw = json
    this.errors = this.raw.errors
  }
}

export class AjaxError extends Error {
  constructor(json, ...arguments_) {
    super(...arguments_)
    this.name = this.constructor.name
    this.message = JSON.stringify(json)
    this.data = undefined
    this.formatted = this.message
  }
}

export function clamp(value, min, max) {
  if (max < min) max = min
  return value <= min ? min : value >= max ? max : value
}

export function getRef(object, property) {
  return {
    get value() {
      return object[property]
    },
    set value(value) {
      object[property] = value
    },
  }
}

export function getBindedRef(object, ownerIndex, nestedIndex) {
  return {
    get value() {
      return object.cells[ownerIndex].cells[nestedIndex].value
    },
    set value(value) {
      object.cells[ownerIndex].cells[nestedIndex].value = value
    },
    addBinding(value) {
      object.cells[ownerIndex].cells[nestedIndex].addBinding(value)
    },
  }
}

// NOTE: полезные фичи на будущее
// const skip = (num) => new Array(num)
// const _ = undefined
