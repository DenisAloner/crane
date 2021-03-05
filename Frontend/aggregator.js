import { Scheme } from './graph-ql/gql.js'
import { GqlMutation } from './graph-ql/gql-mutation.js'
import { $ARGUMENTS, _ } from './graph-ql/gql-constants.js'

const isObject = function (object) {
  return object && typeof object === 'object'
}

function assignDeep(target, source) {
  for (const key in source) {
    if (isObject(source[key])) {
      if (target[key] === _) {
        Object.assign(target, { [key]: source[key] })
      } else {
        if (!target[key]) {
          Object.assign(target, { [key]: {} })
        }
        assignDeep(target[key], source[key])
      }
    } else {
      Object.assign(target, { [key]: source[key] })
    }
  }
}

export class Aggregator {
  constructor() {
    this.map = new Map()
  }

  //   compareArguments (left, right) {
  //     if (!(left && right)) { return false }
  //     const leftKeys = Object.keys(left)
  //     const rightKeys = Object.keys(right)
  //     if (left.length !== right.length) { return false }
  //     for (const [i, element] of leftKeys.entries()) {
  //       if (!(element === rightKeys[i] && left[element] === right[rightKeys[i]])) { return false }
  //     }
  //     return true
  //   }

  byFields(query) {
    const name = Object.keys(query)[0]
    const fields = query[name]
    let aggregatedQuery = this.map.get(name)
    if (aggregatedQuery !== undefined) {
      const key = JSON.stringify(fields[$ARGUMENTS])
      const value = aggregatedQuery.get(key)
      if (value !== undefined && value !== null) {
        assignDeep(value, fields)
      } else {
        aggregatedQuery.set(key, fields)
      }
      return
    }
    aggregatedQuery = new Map()
    this.map.set(name, aggregatedQuery)
    aggregatedQuery.set(JSON.stringify(fields[$ARGUMENTS]), fields)
  }

  byArguments() {
    this.map.forEach((map, name) => {
      if (Scheme.queries.get(name) instanceof GqlMutation) {
        return
      }
      map.forEach((root) => {
        if (!root[$ARGUMENTS]) {
          return
        }
        const ar = Object.entries(root[$ARGUMENTS])
        if (ar.length !== 1) {
          return
        }
        for (const root2 of map) {
          const [key, fields] = root2
          if (root === fields || !fields[$ARGUMENTS]) {
            continue
          }
          const br = Object.entries(fields[$ARGUMENTS])
          if (
            br.length === 1 &&
            ar[0][0] === br[0][0] &&
            this.compareFields(root, fields)
          ) {
            if (Array.isArray(ar[0][1])) {
              ar[0][1].push(br[0][1])
            } else {
              root[$ARGUMENTS][ar[0][0]] = [ar[0][1], br[0][1]]
              ar[0][1] = root[$ARGUMENTS][ar[0][0]]
            }
            map.delete(key)
          }
        }
      })
    })
  }

  compareFields(left, right) {
    for (const property in left) {
      if (left.hasOwnProperty(property) !== right.hasOwnProperty(property)) {
        return false
      }
      switch (typeof left[property]) {
        // Deep compare objects
        case 'object':
          if (!this.compareFields(left[property], right[property])) {
            return false
          }
          break
        // Compare values
        default:
          if (left[property] !== right[property]) {
            return false
          }
      }
    }
    for (const property in right) {
      if (!left.hasOwnProperty(property)) {
        return false
      }
    }
    return true
  }
}
