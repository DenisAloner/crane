import { Binder } from './binder.js'

export class BinderProperty extends Binder {
  constructor (path, property) {
    super(...path)
    this.property = property
  }

  getProperty (object) {
    const path = this.path.concat(this.property)
    let result = object
    for (const element of path) {
      if (result) {
        result = result[element]
      } else return undefined
    }
    return result
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
