import { ObservableSet } from '../observable.js'
import { _ } from './gql-constants.js'
import { GqlType } from './gql-type.js'

export class GqlSet extends GqlType {
  constructor (type) {
    super()
    this.fields = type
  }

  resolve (object) {
    if (object === null) return null
    const cache = new ObservableSet()
    if (typeof this.fields === 'function') {
      if (object) {
        object.forEach(value => { cache.set(value) })
      }
      return cache
    } else if (object !== undefined) {
      object.forEach(value => { cache.set(this.fields.resolve(value)) })
      return cache
    }
  }

  serialize (object) {
    if (object === _) { return '' }
    return this.fields.serialize(object)
  }
}
