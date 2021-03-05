export function curry (fn) {
  return function () {
    if (fn.length <= 1 || arguments.length >= fn.length) {
      return Reflect.apply(fn, this, arguments)
    }
    return [].reduce.call(arguments, function (l, c) {
      return curry(l.bind(null, c))
    }, fn)
  }
}

export function pipe (...fns) {
  return function (pipedFn) {
    return fns.reduce(function (value, fn) {
      return fn(value)
    }, pipedFn)
  }
}

function inspectFunction (fn) {
  return fn.name ? fn.name : fn.toString()
}

function inspectTerm (t) {
  switch (typeof t) {
    case 'string':
      return `'${t}'`
    case 'object': {
      const ts = Object.keys(t).map(k => [k, inspect(t[k])])
      return `{${ts.map(kv => kv.join(': ')).join(', ')}}`
    }
    default:
      return String(t)
  }
}

function inspectArguments (arguments_) {
  return Array.isArray(arguments_) ? `[${arguments_.map(inspect).join(', ')}]` : inspectTerm(arguments_)
}

export function inspect (value) {
  if (value && typeof value.inspect === 'function') { return value.inspect() }
  return (typeof value === 'function') ? inspectFunction(value) : inspectArguments(value)
}

export const map = curry(function (fn, value) { return value.map(fn) })

export const property = curry(function (property, object) { return object[property] })
