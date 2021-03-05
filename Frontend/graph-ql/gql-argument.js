import { GqlType } from './gql-type.js'

export class GqlArgument {
  constructor(name, type) {
    if (typeof name !== 'string') {
      throw new TypeError('Аргумент <name> должен иметь тип <string>')
    }
    if (!(typeof type === 'object' && type instanceof GqlType)) {
      throw new TypeError(
        'Аргумент <type> должно иметь тип совместимый с <GqlType>'
      )
    }
    this.name = name
    this.type = type
  }

  serialize(input) {
    if (!Array.isArray(input)) {
      return `${this.name}:${this.type.serialize(input)}`
    }
    const serializedElements = []
    for (const element of input) {
      serializedElements.push(this.type.serialize(element))
    }
    return `${this.name}:[${serializedElements.join(',')}]`
  }

  validate(input) {
    const maybeError = this.type.validate(input)
    return maybeError !== undefined
      ? { input, type: this, error: maybeError }
      : undefined
  }
}
