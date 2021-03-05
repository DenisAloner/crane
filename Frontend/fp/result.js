import { curry } from './fp.js'
import { Left, Right } from './either.js'

export const result = curry((fail, success, either) => {
  switch (either.constructor) {
    case Left:
      return fail(either.value)

    case Right:
      return success(either.value)

      // No Default
  }
})
