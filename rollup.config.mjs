import fs from 'fs'
import dts from 'rollup-plugin-dts'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

import {createRequire} from 'module'
const require = createRequire(import.meta.url)
const pkg = require('./package.json')

const name = pkg.name
const license = fs.readFileSync('LICENSE').toString('utf-8').trim()
const banner = `
/**
 * ${name} v${pkg.version}
 * ${pkg.homepage}
 *
 * @license
 * ${license.replace(/\n/g, '\n * ')}
 */
`.trim()

const external = [...Object.keys(pkg.peerDependencies)]

/** @type {import('rollup').RollupOptions} */
export default [
    {
        input: 'src/index.ts',
        output: {
            banner,
            dir: pkg.main.split('/').slice(0, -1).join('/'),
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [
            typescript({target: 'es6'}),
            commonjs({
                defaultIsModuleExports: false,
            }),
            nodePolyfills(),
            resolve({browser: true}),
            json(),
        ],
        external,
    },
    {
        input: 'src/index.ts',
        output: {
            banner,
            dir: pkg.module.split('/').slice(0, -1).join('/'),
            format: 'esm',
            sourcemap: true,
        },
        plugins: [
            typescript({target: 'es2020'}),
            commonjs({
                defaultIsModuleExports: false,
            }),
            nodePolyfills(),
            resolve({browser: true}),
            json(),
        ],
        external,
    },
    {
        input: 'src/index.ts',
        output: {banner, dir: pkg.types.split('/').slice(0, -1).join('/'), format: 'esm'},
        plugins: [dts()],
    },
]
