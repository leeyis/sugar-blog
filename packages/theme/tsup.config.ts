import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/node.ts'],
  outDir: path.resolve(__dirname, './'),
  dts: true,
  external: ['vitepress'],
  noExternal: ['vitepress-plugin-tabs']
})
