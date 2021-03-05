import { GqlArgument } from './gql-argument.js'

export class GqlArgumentsList extends Map {
  constructor(argumentsArray, required = true) {
    super()
    if (!Array.isArray(argumentsArray)) {
      throw new TypeError('Аргумент <argumentsArray> должно иметь тип <Array>')
    }
    this.required = required
    for (const argument of argumentsArray) {
      if (!(typeof argument === 'object' && argument instanceof GqlArgument)) {
        throw new TypeError(
          'Элемент <argumentsArray> должен иметь тип совместимый с <GqlArgument>'
        )
      }
      if (this.has(argument.name)) {
        throw new Error(
          `Аргумент <${argument.name}> уже присутствует в списке аргументов`
        )
      }
      this.set(argument.name, argument)
    }
  }

  get required() {
    return this._required
  }

  set required(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('Аргумент <value> должно иметь тип <Boolean>')
    }
    this._required = value
  }

  serialize(input) {
    const serializedArguments = []
    for (const key in input) {
      const argument = this.get(key)
      serializedArguments.push(argument.serialize(input[key]))
    }
    return serializedArguments.length !== 0
      ? `(${serializedArguments.join(',')})`
      : ''
  }

  validate(input) {
    if (input === undefined) {
      return this._required
        ? {
            input,
            type: this,
            error:
              'Список аргументов помечен как обязательный, но аргументы отсутствуют',
          }
        : undefined
    }
    let maybeError
    for (const [argumentName, argumentType] of this) {
      const argument = input[argumentName]
      const maybeErrorValidate = argumentType.validate(argument)
      if (maybeErrorValidate !== undefined) {
        if (maybeError === undefined) {
          maybeError = { input, type: this, error: {} }
        }
        maybeError.error[argumentName] = maybeErrorValidate
      }
    }
    return maybeError
  }
}
