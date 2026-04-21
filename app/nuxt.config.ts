// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@openape/nuxt-auth-sp'],

  css: ['~/assets/main.css'],

  runtimeConfig: {
    // DB
    tursoUrl: process.env.TURSO_URL || 'file:./dev.db',
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
    // Invite JWT
    inviteSecret: process.env.NUXT_INVITE_SECRET || 'dev-invite-secret-change-me-min-32-chars',
    public: {
      siteName: 'OpenApe Plans',
    },
  },

  openapeSp: {
    clientId: process.env.NUXT_OPENAPE_CLIENT_ID || 'plans.openape.ai',
    spName: 'OpenApe Plans',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'dev-session-secret-at-least-32-characters-long',
    fallbackIdpUrl: process.env.NUXT_FALLBACK_IDP_URL || 'https://id.openape.ai',
  },

  nitro: {
    preset: 'node-server',
  },
})
