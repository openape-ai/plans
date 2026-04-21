<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOpenApeAuth } from '#imports'

const { user, fetchUser } = useOpenApeAuth()
const route = useRoute()
const teamId = computed(() => String(route.params.id))

interface TeamMember { email: string, role: 'owner' | 'editor' | 'viewer', joined_at: number }
interface TeamPlan {
  id: string
  title: string
  status: 'draft' | 'active' | 'done' | 'archived'
  owner_email: string
  updated_at: number
  updated_by: string
}
interface TeamDetail {
  id: string
  name: string
  description: string | null
  created_at: number
  members: TeamMember[]
  plans: TeamPlan[]
}

const detail = ref<TeamDetail | null>(null)
const loading = ref(true)
const error = ref('')

const callerRole = computed<'owner' | 'editor' | 'viewer' | null>(() => {
  if (!detail.value || !user.value) return null
  return detail.value.members.find(m => m.email === user.value?.sub || m.email === user.value?.email)?.role ?? null
})
const canEdit = computed(() => callerRole.value === 'owner' || callerRole.value === 'editor')

onMounted(async () => {
  await fetchUser()
  if (!user.value) {
    await navigateTo('/login')
    return
  }
  await loadDetail()
})

async function loadDetail() {
  loading.value = true
  error.value = ''
  try {
    detail.value = await ($fetch as any)(`/api/teams/${teamId.value}`) as TeamDetail
  }
  catch (err: unknown) {
    const e = err as { data?: { title?: string }, statusCode?: number }
    error.value = e.data?.title ?? 'Failed to load team'
    detail.value = null
  }
  finally {
    loading.value = false
  }
}

function formatRelative(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function statusColor(s: TeamPlan['status']): 'neutral' | 'primary' | 'success' | 'warning' {
  if (s === 'active') return 'primary'
  if (s === 'done') return 'success'
  if (s === 'archived') return 'warning'
  return 'neutral'
}

async function removeMember(email: string) {
  if (!confirm(`Remove ${email} from this team?`)) return
  try {
    await ($fetch as any)(`/api/teams/${teamId.value}/members/${encodeURIComponent(email)}`, { method: 'DELETE' })
    await loadDetail()
  }
  catch (err: unknown) {
    const e = err as { data?: { title?: string } }
    error.value = e.data?.title ?? 'Failed to remove member'
  }
}
</script>

<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <UButton to="/teams" color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm">
          All teams
        </UButton>
      </div>

      <div v-if="loading" class="text-center text-gray-500 mt-10">
        Loading…
      </div>

      <UAlert v-else-if="error" color="error" :title="error" />

      <div v-else-if="detail">
        <div class="mb-6">
          <h1 class="text-2xl font-bold">
            {{ detail.name }}
          </h1>
          <p v-if="detail.description" class="text-gray-500 mt-1">
            {{ detail.description }}
          </p>
        </div>

        <!-- Plans -->
        <section class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">
              Plans
            </h2>
            <UButton
              v-if="canEdit"
              :to="`/teams/${teamId}/plans/new`"
              color="primary"
              icon="i-lucide-plus"
              size="sm"
            >
              New plan
            </UButton>
          </div>
          <div v-if="detail.plans.length === 0" class="text-center py-8 text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p class="mb-3">
              No plans yet.
            </p>
            <UButton
              v-if="canEdit"
              :to="`/teams/${teamId}/plans/new`"
              color="primary"
              icon="i-lucide-plus"
              size="sm"
            >
              Create first plan
            </UButton>
          </div>
          <div v-else class="grid grid-cols-1 gap-2">
            <NuxtLink
              v-for="p in detail.plans"
              :key="p.id"
              :to="`/teams/${teamId}/plans/${p.id}`"
              class="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm transition"
            >
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <div class="font-medium truncate">
                    {{ p.title }}
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">
                    {{ p.owner_email }} · updated {{ formatRelative(p.updated_at) }}
                  </div>
                </div>
                <UBadge :color="statusColor(p.status)" variant="subtle" size="xs">
                  {{ p.status }}
                </UBadge>
              </div>
            </NuxtLink>
          </div>
        </section>

        <!-- Members -->
        <section>
          <h2 class="text-lg font-semibold mb-3">
            Members ({{ detail.members.length }})
          </h2>
          <div class="grid grid-cols-1 gap-2">
            <div
              v-for="m in detail.members"
              :key="m.email"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <UIcon name="i-lucide-user" class="text-gray-400" />
              <div class="min-w-0 flex-1">
                <div class="font-mono text-sm truncate">
                  {{ m.email }}
                </div>
              </div>
              <UBadge :color="m.role === 'owner' ? 'primary' : 'neutral'" variant="subtle" size="xs">
                {{ m.role }}
              </UBadge>
              <UButton
                v-if="callerRole === 'owner' && m.email !== user?.email && m.email !== user?.sub"
                color="error"
                variant="ghost"
                icon="i-lucide-x"
                size="xs"
                @click="removeMember(m.email)"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
