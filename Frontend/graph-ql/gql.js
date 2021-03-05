import { GqlEnum } from './gql-enum.js'
import { GqlArgumentsList } from './gql-arguments-list.js'
import { GqlMap } from './gql-map.js'
import { GqlSet } from './gql-set.js'
import { GqlArray } from './gql-array.js'
import { GqlQuery } from './gql-query.js'
import { GqlMutation } from './gql-mutation.js'
import { GqlObjectType } from './gql-object.js'
import { GqlType } from './gql-type.js'
import { GqlField } from './gql-field.js'
import { GqlArgument } from './gql-argument.js'
import { GqlNonNull } from './qgl-non-null.js'

export function gql(name, fieldsArray, _arguments) {
  return [name, fieldsArray, _arguments]
}

export function field(name, type, argumentsList) {
  return new GqlField(name, type, argumentsList)
}

export function argument(name, type) {
  return new GqlArgument(name, type)
}

export function args(argumentsArray, required) {
  return new GqlArgumentsList(argumentsArray, required)
}

export function nonNull(target) {
  return new GqlNonNull(target)
}

export const Scheme = new (class {
  constructor() {
    this.types = new Map()
    this.queries = new Map()
  }

  validate(query) {
    const name = Object.keys(query)[0]
    const type = this.queries.get(name)
    if (type === undefined) {
      return { error: `query <${name}> not found` }
    }
    return type.validate(query[name])
  }

  type(typeName) {
    return this.types.get(typeName)
  }

  map(type) {
    return new GqlMap(type)
  }

  set(typeName) {
    return new GqlSet(typeName)
  }

  array(typeName) {
    return new GqlArray(typeName)
  }

  enum(enumType) {
    return new GqlEnum(enumType)
  }

  resolve(response) {
    const data = []
    response.forEach((item) => {
      const key = Object.keys(item)[0]
      const fields = item[key]
      const type = this.queries.get(key)
      if (type === undefined) {
        throw new Error(`Запрос <${key}> отсутствует в схеме`)
      }
      data.push({ [key]: type.resolve(fields) })
    })
    return data
  }

  addType(definition) {
    const { $name, $fields } = definition
    if ($name === undefined) {
      throw new Error('Type must have a name')
    }
    if (this.types.has(name)) {
      throw new Error(`A type named <${name}> already exists`)
    }
    if ($fields === undefined) {
      throw new Error(`A type named <${name}> must have a fields`)
    }
    if (typeof $fields !== 'object') {
      throw new TypeError('A type of $fields must be object')
    }
    if ($fields === null) {
      throw new TypeError('A type of $fields must be non-null')
    }
    const object = new GqlObjectType($name)
    for (const fieldName in $fields) {
      const fieldValue = $fields[fieldName]
      switch (typeof fieldValue) {
        case 'object':
          if (fieldValue === null) {
            throw new Error(`Field <${fieldName}> must be non-null`)
          }
          if (!(fieldValue instanceof GqlType)) {
            throw new TypeError(
              `Field <${fieldName}> must be instance of GqlType`
            )
          }
          object.fields[fieldName] = fieldValue
          break
        case 'string':
          object.fields[fieldName] = fieldValue
          break
        default:
          throw new Error(
            `Field <${fieldName}> of ObjectType <${$name}> has invalid type`
          )
      }
    }
    this.types.set($name, object)
  }

  newType(name) {
    if (this.types.has(name)) {
      throw new Error(`ObjectType <${name}> уже существует`)
    }
    const type = new GqlObjectType(name)
    this.types.set(name, type)
    return type
  }

  newQuery(name, type, argumentsList) {
    if (this.queries.has(name)) {
      throw new Error(`Запрос <${name}> уже существует`)
    }
    const query = new GqlQuery(name, type, argumentsList)
    this.queries.set(name, query)
    return query
  }

  addMutation(scheme) {
    const [name, fields] = Object.entries(scheme)[0]
    const type = new GqlMutation()
    type.name = name
    if (typeof fields === 'object' && fields instanceof GqlType) {
      type.fields = fields
      this.queries.set(name, type)
      return
    }
    throw new Error(`${name}: <${typeof fields}> not valid type`)
  }

  addUpdateQueries(typeName) {
    const type = Scheme.type(typeName)
    console.log(type)
    for (const property in type.fields) {
      const field = type.fields[property]
      if (field === undefined) continue
      if (field instanceof GqlType) {
        if (field instanceof GqlEnum) {
          this.addQuery({
            [`${typeName}_update_${property}`]: Scheme.args(
              {
                id: Number,
                old: field,
                new: field,
              },
              Boolean
            ),
          })
        } else {
          this.addQuery({
            [`${typeName}_update_${property}`]: Scheme.args(
              {
                id: Number,
                old: Number,
                new: Number,
              },
              Boolean
            ),
          })
        }
      } else {
        this.addQuery({
          [`${typeName}_update_${property}`]: Scheme.args(
            {
              id: Number,
              old: field,
              new: field,
            },
            Boolean
          ),
        })
      }
    }
  }
})()

window.SCHEME = Scheme
