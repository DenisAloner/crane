import { Core } from '../api.js'
import { $ARGUMENTS, _ } from '../graph-ql/gql-constants.js'
import { BinderStore } from './binder-store.js'

export class BinderStoreObject extends BinderStore {
  constructor (getQuery, setQuery, path, property) {
    super(getQuery, setQuery, ...path)
    this.property = property
  }

  setValue (object, value) {
    const old = this.getValue(object)
    Core.socket.execute({
      [this.setQuery]: {
        [$ARGUMENTS]: {
          id: object.id,
          old: old ? old.id : null,
          new: value ? value.id : null
        }
      }
    })
  }

  getProperty (object) {
    const path = this.path.concat(this.property)
    let result = object
    if (result) {
      for (let index = 0; index < path.length; index++) {
        result = result[path[index]]
        if (result === undefined) {
          if (!this.busy) {
            const query = {
              [$ARGUMENTS]: { id: object.id }
            }
            let queryPath = query
            let j = 0
            for (; j < index; j++) {
              queryPath[this.path[j]] = {}
              queryPath = queryPath[path[j]]
            }
            queryPath[path[j]] = _
            return Core.socket.execute({ [this.query]: query })
          }
          return undefined
        } else if (result === null) {
          return undefined
        }
      }
      return result
    } else return undefined
  }

  comparePropertyPath (path) {
    const propertyPath = this.path.concat(this.property)
    if (path.length > propertyPath.length) return false
    for (const [i, element] of path.entries()) {
      if (element !== propertyPath[i]) return false
    }
    return true
  }

  undeferred (value) {
    return this.getProperty(value)
  }
}
