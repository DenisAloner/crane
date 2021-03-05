import { Binder } from './binder.js'

export class BinderOption extends Binder {
  constructor(path, properties, list) {
    super(...path)
    this.properties = properties.map(function (x) {
      return !Array.isArray(x) ? [x] : x
    })
    this.list = list
  }
}
