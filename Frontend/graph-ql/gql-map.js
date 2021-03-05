import { Store } from '../store.js'
import { ObservableMap } from '../observable.js'
import { DELETE } from './gql-constants.js'
import { GqlType } from './gql-type.js'

export class GqlMap extends GqlType {
  constructor (type) {
    super()
    this.type = type
  }

  resolve (object) {
    let cache = Store.observables.get(object.id)
    if (cache === undefined) {
      cache = new ObservableMap()
      cache.type = this
      if (object.id !== undefined) {
        cache.id = object.id
        Store.observables.set(object.id, cache)
      } else {
        throw new Error('Object must have id property')
      }
    }
    if (object) {
      for (const key in object) {
        if (key === 'id') {
          continue
        }
        const value = object[key]
        if (value === DELETE) {
          cache.set(key, undefined)
        } else {
          if (value !== null) {
            value.id = key
          }
          cache.set(key, this.type.resolve(value))
        }
      }
      return cache
    }
  }

  serialize (object) {
    return this.type.serialize(object)
  }

  validate (object) {
    return this.type.validate(object)
  }
}
