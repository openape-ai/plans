<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOpenApeAuth } from '#imports'

const { user, fetchUser, login } = useOpenApeAuth()
const email = ref('')
const submitting = ref(false)
const error = ref('')

// OAuth-error surfacing (RFC 6749 §4.1.2.1). The IdP redirects here
// with `?error=...` when the authorize request was rejected. Without
// special handling the user sees the regular login form and a
// confusing URL fragment they don't understand. We translate the
// common error codes to friendly copy and clean the URL so a refresh
// doesn't re-show the alert.
const route = useRoute()
const router = useRouter()
const oauthErrorCode = computed(() => {
  const e = route.query.error
  return typeof e === 'string' ? e : ''
})
const oauthErrorMessage = computed(() => {
  switch (oauthErrorCode.value) {
    case '':
      return ''
    case 'access_denied':
      return 'Die Anmeldung wurde vom Identity Provider abgelehnt. Wahrscheinlich hat dein Domain-Admin diese Anwendung noch nicht freigegeben — frag deinen Admin oder versuche eine andere Email-Adresse.'
    case 'consent_required':
      return 'Diese Anmeldung benötigt eine explizite Zustimmung. Bitte versuche es erneut und stimme im Login-Fenster zu.'
    case 'invalid_request':
    case 'invalid_scope':
    case 'unauthorized_client':
      return `Anmeldung fehlgeschlagen (${oauthErrorCode.value}). Bitte erneut versuchen oder Plans-Support kontaktieren wenn das Problem bestehen bleibt.`
    case 'server_error':
    case 'temporarily_unavailable':
      return 'Der Identity Provider hat gerade einen Fehler. Bitte in ein paar Minuten erneut versuchen.'
    default:
      return `Anmeldung fehlgeschlagen: ${oauthErrorCode.value}.`
  }
})

function dismissOauthError() {
  // Strip the OAuth error params so a refresh doesn't re-render the
  // alert. Keep the rest of the query so we don't break deep-links.
  const next = { ...route.query }
  delete next.error
  delete next.error_description
  delete next.state
  router.replace({ path: route.path, query: next })
}

onMounted(async () => {
  await fetchUser()
  if (user.value) {
    await navigateTo('/teams')
  }
})

async function onSubmit() {
  const value = email.value.trim()
  if (!value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    await login(value)
  }
  catch (err: unknown) {
    const e = err as { data?: { detail?: string, title?: string }, message?: string }
    error.value = e.data?.detail ?? e.data?.title ?? e.message ?? 'Login failed'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
    <main class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md flex flex-col items-center text-center">
        <UAlert
          v-if="oauthErrorCode"
          color="warning"
          variant="subtle"
          icon="i-lucide-shield-alert"
          title="Login nicht möglich"
          :description="oauthErrorMessage"
          class="text-left mb-6 w-full"
          :close-button="{ icon: 'i-lucide-x' }"
          @close="dismissOauthError"
        />

        <div class="text-6xl mb-6" aria-hidden="true">
          📋
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Plans that outlive<br>
          <span class="text-primary-500">the conversation.</span>
        </h1>

        <p class="mt-4 text-zinc-400 text-lg">
          Living plans for humans and agents — across every device.
        </p>

        <form class="w-full mt-10 space-y-3" @submit.prevent="onSubmit">
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            size="xl"
            class="w-full"
            :ui="{ base: 'text-center' }"
          />

          <UButton
            type="submit"
            color="primary"
            block
            size="xl"
            :loading="submitting"
            :disabled="!email.trim() || submitting"
          >
            Login with OpenApe
          </UButton>

          <UAlert
            v-if="error"
            color="error"
            :title="error"
            class="text-left"
            @close="error = ''"
          />
        </form>

        <p class="mt-10 italic text-sm text-zinc-500">
          "Every agent remembers where they left off."
        </p>
      </div>
    </main>

    <footer class="py-6 text-center text-xs text-zinc-600">
      Powered by
      <a
        href="https://openape.ai"
        target="_blank"
        rel="noopener"
        class="text-zinc-400 hover:text-primary-500 transition-colors"
      >OpenApe</a>
    </footer>
  </div>
</template>
