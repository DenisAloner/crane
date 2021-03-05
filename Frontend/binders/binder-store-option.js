import { BinderStore } from './binder-store.js'
import { Core } from '../api.js'
import { $ARGUMENTS } from '../graph-ql/gql-constants.js'

export class BinderStoreOption extends BinderStore {
  constructor (getQuery, setQuery, path, properties, list) {
    super(getQuery, setQuery, ...path)
    this.properties = properties.map(function (x) {
      return !Array.isArray(x) ? [x] : x
    })
    this.list = list
  }
}

export class BinderStoreOptionObject extends BinderStoreOption {
  setValue (object, value) {
    let old = this.getValue(object)
    old = (old !== undefined && old !== null) ? old.id : null
    const _new = (value !== undefined && value !== null) ? value.id : null
    Core.socket.execute({
      [this.setQuery]: {
        [$ARGUMENTS]: {
          id: object.id,
          old,
          new: _new
        }
      }
    })
  }
}
