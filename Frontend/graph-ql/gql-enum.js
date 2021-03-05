import { GqlType } from './gql-type.js'

export class GqlEnum extends GqlType {
  constructor (enumType) {
    super()
    this.enumType = enumType
  }

  resolve (object) {
    return this.enumType[object]
  }

  serialize (object) {
    return object.description
  }

  validate (input) {
  // TODO реализовать проверку
  }
}
