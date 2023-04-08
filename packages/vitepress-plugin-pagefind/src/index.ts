import type { PluginOption } from 'vite'
import type { SiteConfig } from 'vitepress'
import { pluginSiteConfig, getPagesData } from './node'

const docsData = getPagesData()

export interface SearchConfig {
  /**
   * @default
   * 'Search'
   */
  btnPlaceholder?: string
  /**
   * @default
   * 'Search Docs'
   */
  placeholder?: string
  /**
   * @default
   * 'No results found.'
   */
  emptyText?: string
  /**
   * @default
   * 'Total: {{searchResult}} search results.'
   */
  heading?: string
}

export function pagefindPlugin(searchConfig: SearchConfig = {}): any {
  const virtualModuleId = 'virtual:pagefind'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  let resolveConfig: any
  const pluginOps: PluginOption = {
    name: 'vitepress-plugin-pagefind',
    enforce: 'pre',
    config: () => ({
      resolve: {
        alias: {
          './VPNavBarSearch.vue': 'vitepress-plugin-pagefind/Search.vue'
        }
      }
    }),
    configResolved(config: any) {
      if (resolveConfig) {
        return
      }
      resolveConfig = config

      const vitepressConfig: SiteConfig = config.vitepress
      if (!vitepressConfig) {
        return
      }

      // 添加 自定义 vitepress 的钩子

      const selfBuildEnd = vitepressConfig.buildEnd
      vitepressConfig.buildEnd = (siteConfig: any) => {
        // 调用自己的
        selfBuildEnd?.(siteConfig)
        pluginSiteConfig?.buildEnd?.(siteConfig)
      }

      const selfTransformHead = vitepressConfig.transformHead
      vitepressConfig.transformHead = async (ctx) => {
        const selfHead = (await Promise.resolve(selfTransformHead?.(ctx))) || []
        const pluginHead =
          (await Promise.resolve(pluginSiteConfig?.transformHead?.(ctx))) || []
        return selfHead.concat(pluginHead)
      }
    },
    async resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    // 文章数据
    load(this, id) {
      if (id !== resolvedVirtualModuleId) return
      return `
      import { ref } from 'vue'
      export const docs = ref(${JSON.stringify(docsData)})
      export const searchConfig = ${JSON.stringify(searchConfig)}
      `
    },
    // 添加检索的内容标识
    transform(code, id) {
      // 只检索文章内容
      if (id.endsWith('theme-default/Layout.vue')) {
        return code.replace('<VPContent>', '<VPContent data-pagefind-body>')
      }

      // 忽略侧边栏内容
      if (id.endsWith('theme-default/components/VPDoc.vue')) {
        return code.replace(
          'class="aside"',
          'class="aside" data-pagefind-ignore="all"'
        )
      }
      return code
    }
  }
  return pluginOps
}
