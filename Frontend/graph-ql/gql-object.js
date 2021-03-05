import { Store } from '../store.js'
import { ObservableObject } from '../observable.js'
import { STORED, _ } from './gql-constants.js'
import { GqlType } from './gql-type.js'
import { GqlField } from './gql-field.js'

export class GqlObjectType extends GqlType {
  constructor (name) {
    super()
    if (typeof name !== 'string') { throw new TypeError(`Аргумент <name> должен быть типа <String>, а не <${typeof name}>`) }
    this.name = name
    this.fields = new Map()
  }

  resolve (object) {
    if (object === null) { return null }
    let cache
    if (object.id !== undefined) {
      cache = Store.observables.get(object.id)
      if (cache === undefined) {
        cache = new ObservableObject(object.id)
        cache[STORED] = true
        Store.observables.set(object.id, cache)
      }
    } else {
      throw new Error('Object must have id property')
    }
    for (const property in object) {
      const field = this.fields.get(property)
      if (field === undefined) { continue }
      cache[property] = field.resolve(object[property])
    }
    return cache
  }

  serialize (value) {
    const serializedFields = []
    for (const key in value) {
      const field = this.fields.get(key)
      const fieldValue = value[key]
      serializedFields.push(field.serialize(fieldValue))
    }
    return serializedFields.length !== 0 ? `{${serializedFields.join(' ')}}` : ''
  }

  validate (input) {
    if (input === undefined) return
    let maybeError
    for (const key in input) {
      const field = this.fields.get(key)
      if (field === undefined) { return { type: this, error: `Поле <${key}> не объявлено` } }
      const fieldValue = input[key]
      if (fieldValue === _) { continue }
      const errorValidateField = field.validate(fieldValue)
      if (errorValidateField !== undefined) {
        if (maybeError === undefined) { maybeError = { type: this, error: {} } }
        maybeError.error[key] = errorValidateField
      }
    }
    return maybeError
  }

  addFields (fieldsArray) {
    if (!Array.isArray(fieldsArray)) { throw new TypeError('Аргумент <fieldsArray> должен иметь тип <Array>') }
    for (const field of fieldsArray) {
      if (!(typeof field === 'object' && field instanceof GqlField)) { throw new TypeError('Элемент <fieldsArray> должен иметь тип совместимый с <GqlField>') }
      if (this.fields.has(field.name)) { throw new Error(`Поле <${field.name}> уже присутствует в списке полей`) }
      this.fields.set(field.name, field)
    }
  }
}
