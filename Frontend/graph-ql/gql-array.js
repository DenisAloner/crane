import { ObservableArray } from '../observable.js'
import { _ } from './gql-constants.js'
import { GqlType } from './gql-type.js'

export class GqlArray extends GqlType {
  constructor(type) {
    super()
    this.fields = type
  }

  resolve(object) {
    const cache = new ObservableArray()
    if (typeof this.fields === 'function') {
      if (object) {
        object.forEach((value) => {
          cache.set(value)
        })
      }
      return cache
    } else if (object) {
      object.forEach((value) => {
        cache.set(this.fields.resolve(value))
      })
      return cache
    }
  }

  serialize(object) {
    if (object === _) {
      return ''
    }
    return this.fields.serialize(object)
  }
}
