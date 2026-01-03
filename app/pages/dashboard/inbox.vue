<script setup lang="ts">
import type { QuestionStatus, QuestionWithProject, InboxResponse } from '~/types/questions'

definePageMeta({
  middleware: 'auth',
})

// Filter state
const currentStatus = ref<'all' | QuestionStatus>('all')
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待處理', value: 'pending' },
  { label: '已顯示', value: 'visible' },
  { label: '已隱藏', value: 'hidden' },
] as const

// Questions state
const questions = ref<QuestionWithProject[]>([])
const nextCursor = ref<string | null>(null)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const error = ref<string | null>(null)

// Fetch questions
async function fetchQuestions(append = false) {
  if (append) {
    isLoadingMore.value = true
  }
  else {
    isLoading.value = true
    questions.value = []
    nextCursor.value = null
  }

  error.value = null

  try {
    const params: Record<string, string> = {
      status: currentStatus.value,
      limit: '20',
    }

    if (append && nextCursor.value) {
      params.cursor = nextCursor.value
    }

    const data = await $fetch<InboxResponse>('/api/inbox', { params })

    if (append) {
      questions.value = [...questions.value, ...data.questions]
    }
    else {
      questions.value = data.questions
    }
    nextCursor.value = data.nextCursor
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = e.data?.statusMessage || e.statusMessage || '載入失敗'
  }
  finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// Initial load
await fetchQuestions()

// Watch filter changes
watch(currentStatus, () => fetchQuestions())

// Update question status (optimistic UI)
async function updateStatus(question: QuestionWithProject, newStatus: QuestionStatus) {
  const previousStatus = question.status

  // Optimistic update
  question.status = newStatus

  try {
    await $fetch(`/api/questions/${question.id}/status`, {
      method: 'PUT',
      body: { status: newStatus },
    })
  }
  catch {
    // Rollback on error
    question.status = previousStatus
    error.value = '更新失敗，請稍後再試'
  }
}

// Delete question (optimistic UI)
async function deleteQuestion(question: QuestionWithProject) {
  const previousStatus = question.status
  const previousIsHidden = question.isHiddenByStreamer

  // Optimistic update
  question.status = 'hidden'
  question.isHiddenByStreamer = true

  try {
    await $fetch(`/api/questions/${question.id}`, {
      method: 'DELETE',
    })
  }
  catch {
    // Rollback on error
    question.status = previousStatus
    question.isHiddenByStreamer = previousIsHidden
    error.value = '刪除失敗，請稍後再試'
  }
}

// Format date
function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Status badge color
function getStatusColor(status: QuestionStatus) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'visible':
      return 'success'
    case 'hidden':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: QuestionStatus) {
  switch (status) {
    case 'pending':
      return '待處理'
    case 'visible':
      return '已顯示'
    case 'hidden':
      return '已隱藏'
    default:
      return status
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          收件匣
        </h1>
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          :loading="isLoading"
          @click="fetchQuestions()"
        >
          重新整理
        </UButton>
      </div>

      <!-- Filter tabs -->
      <div class="mb-6">
        <UButtonGroup>
          <UButton
            v-for="option in statusOptions"
            :key="option.value"
            :variant="currentStatus === option.value ? 'solid' : 'ghost'"
            @click="currentStatus = option.value"
          >
            {{ option.label }}
          </UButton>
        </UButtonGroup>
      </div>

      <!-- Error message -->
      <UAlert
        v-if="error"
        class="mb-4"
        color="error"
        variant="soft"
        :title="error"
        icon="i-heroicons-exclamation-triangle"
        :close-button="{ icon: 'i-heroicons-x-mark', color: 'gray', variant: 'link' }"
        @close="error = null"
      />

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Empty state -->
      <UCard v-else-if="questions.length === 0" class="text-center">
        <div class="py-12">
          <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-gray-400 mx-auto" />
          <p class="mt-4 text-gray-500">
            目前沒有留言
          </p>
        </div>
      </UCard>

      <!-- Questions list -->
      <div v-else class="space-y-4">
        <UCard
          v-for="question in questions"
          :key="question.id"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Header -->
              <div class="flex items-center gap-2 mb-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ question.displayName }}
                </span>
                <UBadge :color="getStatusColor(question.status)" variant="soft" size="xs">
                  {{ getStatusLabel(question.status) }}
                </UBadge>
                <span class="text-xs text-gray-500">
                  {{ question.project.name }}
                </span>
              </div>

              <!-- Content -->
              <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {{ question.content }}
              </p>

              <!-- Footer -->
              <p class="mt-2 text-xs text-gray-500">
                {{ formatDate(question.createdAt) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <UButton
                v-if="question.status === 'pending'"
                size="xs"
                variant="soft"
                icon="i-heroicons-check"
                @click="updateStatus(question, 'visible')"
              >
                顯示
              </UButton>
              <UButton
                v-if="question.status !== 'hidden'"
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-eye-slash"
                @click="updateStatus(question, 'hidden')"
              >
                隱藏
              </UButton>
              <UButton
                v-if="!question.isHiddenByStreamer"
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                @click="deleteQuestion(question)"
              >
                刪除
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Load more -->
        <div v-if="nextCursor" class="text-center pt-4">
          <UButton
            variant="soft"
            :loading="isLoadingMore"
            @click="fetchQuestions(true)"
          >
            載入更多
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
