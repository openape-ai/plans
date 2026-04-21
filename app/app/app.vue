<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'en' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: '#ffffff' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Plans' },
  ],
})

useSeoMeta({
  title: 'OpenApe Plans',
  description: 'Collaborative plan management for humans and agents.',
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
