import { GqlType } from './gql-type.js'

export class GqlNonNull extends GqlType {
  constructor(target) {
    super()
    this.target = target
  }

  resolve(input) {
    return this.target.resolve(input)
  }

  serialize(input) {
    if (input === undefined)
      return { error: 'Значение не может быть неопределенным' }
    return this.target.serialize(input)
  }

  validate(input) {
    return input === undefined
      ? 'Значение не может быть неопределенным'
      : this.target.validate(input)
  }
}
