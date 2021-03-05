export class GqlType {
  serialize (object) {
    return { value: object }
  }

  validate () {
    return `Функция <validate> не реализована для типа <${this.constructor.name}>`
  }
}
