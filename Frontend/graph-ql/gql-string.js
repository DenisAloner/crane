import { GqlType } from './gql-type.js'

export const GqlString = new class GqlString extends GqlType {
  resolve (input) {
    if (input === null) { return null }
    if (typeof input === 'string') { return input }
    throw new Error('Тип должен быть <GqlString>')
  }

  serialize (input) {
    return input === undefined ? 'null' : JSON.stringify(input)
  }

  validate (input) {
    if (input !== undefined && input !== null && typeof input !== 'string') { return { input, error: 'Тип должен быть <string>' } }
  }
}()
