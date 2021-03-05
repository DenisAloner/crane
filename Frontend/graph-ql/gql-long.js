import { GqlType } from './gql-type.js'

export const GqlLong = new class GqlLong extends GqlType {
  resolve (object) {
    if (typeof object !== 'number') { throw new TypeError(`Object <${object}> must be <GqlLong>`) }
    return object
  }

  serialize (object) {
    return object
  }

  validate (input) {
    if (input !== undefined && typeof input !== 'number') { return 'Тип должен быть <number>' }
  }
}()
