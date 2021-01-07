import Debug from 'debug'
import { Transformer } from '../types'
import { Context } from '../context'
import { pascalCase, stringifyComponentImport } from '../utils'

const debug = Debug('vite-plugin-components:transform')

export function VueTransformer(ctx: Context): Transformer {
  return (code, id, path, query) => {
    if (!(path.endsWith('.vue') || ctx.options.customLoaderMatcher(id)))
      return code

    if (ctx.viteConfig?.command === 'serve')
      ctx.searchGlob(500)
    else
      ctx.searchGlob()

    const sfcPath = ctx.normalizePath(path)
    debug(sfcPath)

    const head: string[] = []
    let no = 0

    let transformed = code.replace(/_resolveComponent\("(.+?)"\)/g, (str, match) => {
      if (match) {
        debug(`| ${match}`)
        const component = ctx.findComponent(pascalCase(match), [sfcPath])
        if (component) {
          const var_name = `__vite_component_${no}`
          head.push(stringifyComponentImport({ ...component, name: var_name }))
          no += 1
          return var_name
        }
      }
      return str
    })

    debug(`^ (${no})`)

    transformed = `${head.join('\n')}\n${transformed}`

    return transformed
  }
}
