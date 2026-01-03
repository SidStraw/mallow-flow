// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    'nuxt-auth-utils',
  ],

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4,
  },

  typescript: {
    strict: true,
    typeCheck: false, // 暫時關閉，避免 vite-plugin-checker 問題
  },

  eslint: {
    config: {
      standalone: true,
    },
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.NUXT_SESSION_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  },

  nitro: {
    preset: 'cloudflare-pages',
  },
})
