<script setup lang="ts">
import { useOpenApeAuth } from '#imports'

const { user, loading, fetchUser } = useOpenApeAuth()

onMounted(async () => {
  await fetchUser()
  if (user.value) {
    await navigateTo('/teams')
  }
  else {
    await navigateTo('/login')
  }
})
</script>

<template>
  <div class="min-h-dvh flex items-center justify-center p-4">
    <div class="text-center text-gray-400">
      <p v-if="loading">
        Loading…
      </p>
    </div>
  </div>
</template>
