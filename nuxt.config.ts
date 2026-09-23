// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
