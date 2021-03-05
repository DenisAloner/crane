import { Binder } from './binder.js'
import { Core } from '../api.js'
import { $ARGUMENTS, _, STORED } from '../graph-ql/gql-constants.js'

export class BinderStore extends Binder {
  constructor (getQuery, setQuery, ...path) {
    super(...path)
    this.query = getQuery
    this.setQuery = setQuery
    this.path = path
    this.busy = false
  }

  getValue (object) {
    let result = object
    if (result) {
      for (let index = 0; index < this.path.length; index++) {
        result = result[this.path[index]]
        if (result === undefined) {
          if (object[STORED] === undefined || object[STORED] === false) return undefined
          if (!this.busy) {
            const query = {
              [$ARGUMENTS]: { id: object.id }
            }
            let queryPath = query
            let j = 0
            for (; j < index; j++) {
              queryPath[this.path[j]] = {}
              queryPath = queryPath[this.path[j]]
            }
            queryPath[this.path[j]] = _
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

  setValue (object, value) {
    Core.socket.execute({
      [this.setQuery]: {
        [$ARGUMENTS]: {
          id: object.id,
          old: this.getValue(object),
          new: value
        }
      }
    })
  }
}
