import { GqlType } from './gql-type.js'
import { nonNull } from './gql.js'

export const GqlId64 = new class GqlId64 extends GqlType {
  resolve (input) {
    if (input === null) { return null }
    if (typeof input !== 'string') { throw new TypeError(`Объект <${input}> должен иметь тип <GqlId64>`) }
    return input
  }

  serialize (object) {
    return object
  }

  validate (input) {
    if (input !== undefined && input !== null && typeof input !== 'string') { return 'Тип должен быть <GqlId64>' }
  }
}()

export const GqlNonNullId64 = nonNull(GqlId64)
