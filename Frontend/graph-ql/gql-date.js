import { GqlType } from './gql-type.js'

export const GqlDate = new class GqlDate extends GqlType {
  resolve (object) {
    return new Date(object)
  }
}()
