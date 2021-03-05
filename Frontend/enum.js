export function makeEnum(values) {
  const object = {}
  for (const value of values) {
    object[value] = Symbol(value)
  }
  return Object.freeze(object)
}
