import { GqlType } from './gql-type.js'

export const GqlBoolean = new (class GqlBoolean extends GqlType {
  resolve(input) {
    if (input === null) {
      return null
    }
    if (typeof input === 'boolean') {
      return input
    }
    throw new Error('Object must be <GqlBoolean>')
  }

  serialize(input) {
    return input
  }

  validate(input) {
    if (input !== undefined && typeof input !== 'boolean') {
      return 'Тип должен быть <boolean>'
    }
  }
})()
