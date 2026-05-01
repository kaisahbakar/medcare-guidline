import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function transformJsxInJs() {
  return {
    name: 'transform-jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.match(/\/src\/.*\.js$/)) return null
      return transformWithOxc(code, id, { lang: 'jsx' })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: {
        '.js': 'jsx',
      },
    },
  },
  plugins: [transformJsxInJs(), react({ include: /\.[jt]sx?$/ }), tailwindcss()],
})
