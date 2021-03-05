export class Binder {
  constructor (...path) {
    this.path = path
  }

  getValue (object) {
    let result = object
    for (let index = 0; index < this.path.length; index++) {
      if (result) {
        result = result[this.path[index]]
      } else return undefined
    }
    return result
  }

  setValue (object, value) {
    let result = object
    let index
    for (index = 0; index < this.path.length - 1; index++) {
      if (result) {
        result = result[this.path[index]]
      } else return
    }
    result[this.path[index]] = value
  }

  comparePath (path) {
    if (path.length > this.path.length) return false
    for (const [i, element] of path.entries()) {
      if (element !== this.path[i]) return false
    }
    return true
  }

  undeferred (value) {
    return this.getValue(value)
  }
}
