import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import del from 'rollup-plugin-delete'

const isProduction = process.env.BUILD !== 'DEBUG'

export default {
  input: 'index.js',
  output: {
    dir: 'build',
    format: 'es',
  },
  treeshake: isProduction,
  preserveEntrySignatures: false,
  plugins: [
    del({ targets: 'build/**/*' }),
    nodeResolve({ browser: true }),
    commonjs({ sourceMap: false }),
    isProduction &&
      terser({
        ecma: 2021,
        module: true,
        toplevel: true,
        compress: {
          passes: 10,
        },
      }),
  ],
}
