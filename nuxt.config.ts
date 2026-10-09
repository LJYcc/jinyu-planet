// https://nuxt.com/docs/api/configuration/nuxt-config
import svgLoader from 'vite-svg-loader';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    plugins: [
      // 将 assets/svg 下的 SVG 转换为可直接在模板中使用的 Vue 组件。
      svgLoader()
    ]
  },
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', '@element-plus/nuxt'],
  elementPlus: {
    defaultLocale: 'zh-cn',
    importStyle: 'scss',
    themeChalk: {
      $colors: {
        primary: { base: '#c7a840' },
        warning: { base: '#c99f42' }
      }
    }
  }
});
