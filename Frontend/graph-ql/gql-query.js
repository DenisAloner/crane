import { $ARGUMENTS } from './gql-constants.js'
import { GqlType } from './gql-type.js'
import { GqlArgumentsList } from './gql-arguments-list.js'

export class GqlQuery {
  constructor (name, type, argumentsList) {
    if (typeof name !== 'string') { throw new TypeError('Аргумент <name> должен иметь тип <String>') }
    if (!(typeof type === 'object' && type instanceof GqlType)) { throw new TypeError('Аргумент <type> должно иметь тип совместимый с <GqlType>') }
    this.name = name
    this.type = type
    if (argumentsList !== undefined) {
      if (!(typeof argumentsList === 'object' && argumentsList instanceof GqlArgumentsList)) { throw new TypeError('Аргумент <argumentsList> должно иметь тип совместимый с <GqlArgumentsList>') }
      this.arguments = argumentsList
    }
  }

  resolve (object) {
    return this.type.resolve(object)
  }

  serialize (input) {
    return `${this.name}${this.arguments !== undefined ? this.arguments.serialize(input[$ARGUMENTS]) : ''}${Object.keys(input).length !== 0 ? this.type.serialize(input) : ''}`
  }

  validate (input) {
    let maybeError
    if (this.arguments !== undefined) {
      const errorValidateArguments = this.arguments.validate(input[$ARGUMENTS])
      if (errorValidateArguments !== undefined) { maybeError = { input, type: this, error: { arguments: errorValidateArguments } } }
    }
    if (Object.keys(input).length !== 0) {
      const errorValidateType = this.type.validate(input)
      if (errorValidateType !== undefined) {
        if (maybeError === undefined) { maybeError = { input, type: this, error: { } } }
        maybeError.error.returnType = errorValidateType
      }
    }
    return maybeError
  }
}
