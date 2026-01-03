<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

// Fetch streamer and projects
const { data, error, status } = await useFetch(`/api/streamers/${slug}`)

// Form state
interface FormState {
  projectId: string
  displayName: string
  content: string
}

const formState = reactive<FormState>({
  projectId: '',
  displayName: '',
  content: '',
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref<string | null>(null)
const formErrors = ref<{ content?: string }>({})

// Set default project when data loads
watch(data, (val) => {
  if (val?.projects && val.projects.length > 0 && !formState.projectId) {
    formState.projectId = val.projects[0]!.id
  }
}, { immediate: true })

function validateForm(): boolean {
  formErrors.value = {}

  if (formState.content.length < 10) {
    formErrors.value.content = '留言內容至少需要 10 個字'
    return false
  }
  if (formState.content.length > 500) {
    formErrors.value.content = '留言內容不能超過 500 個字'
    return false
  }

  return true
}

async function onSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    await $fetch('/api/questions', {
      method: 'POST',
      body: {
        projectId: formState.projectId,
        content: formState.content,
        displayName: formState.displayName || undefined,
      },
    })

    submitSuccess.value = true
    // Reset form
    formState.content = ''
    formState.displayName = ''
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }, statusMessage?: string }
    submitError.value = e.data?.statusMessage || e.statusMessage || '投稿失敗，請稍後再試'
  }
  finally {
    isSubmitting.value = false
  }
}

function resetSuccess() {
  submitSuccess.value = false
}

const contentLength = computed(() => formState.content.length)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
    <div class="max-w-lg mx-auto">
      <!-- Loading state -->
      <div v-if="status === 'pending'" class="text-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
        <p class="mt-2 text-gray-500">載入中...</p>
      </div>

      <!-- Error state -->
      <UCard v-else-if="error" class="text-center">
        <div class="py-8">
          <UIcon name="i-heroicons-exclamation-circle" class="w-12 h-12 text-red-500 mx-auto" />
          <h1 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            找不到頁面
          </h1>
          <p class="mt-2 text-gray-500">
            {{ error.statusMessage || '找不到該直播主' }}
          </p>
        </div>
      </UCard>

      <!-- Success state -->
      <UCard v-else-if="submitSuccess" class="text-center">
        <div class="py-8">
          <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
          <h1 class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            投稿成功！
          </h1>
          <p class="mt-2 text-gray-500">
            感謝您的留言，直播主會收到您的訊息。
          </p>
          <UButton
            class="mt-6"
            variant="soft"
            @click="resetSuccess"
          >
            繼續投稿
          </UButton>
        </div>
      </UCard>

      <!-- Form -->
      <template v-else-if="data">
        <div class="text-center mb-8">
          <UAvatar
            v-if="data.streamer.avatarUrl"
            :src="data.streamer.avatarUrl"
            :alt="data.streamer.displayName || '直播主'"
            size="xl"
          />
          <h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {{ data.streamer.displayName || '直播主' }}
          </h1>
          <p class="mt-1 text-gray-500">
            向我發送留言
          </p>
        </div>

        <UCard>
          <form class="space-y-4" @submit.prevent="onSubmit">
            <!-- Project selector (only show if multiple projects) -->
            <UFormField
              v-if="data.projects.length > 1"
              label="選擇專案"
              name="projectId"
            >
              <USelect
                v-model="formState.projectId"
                :items="data.projects.map(p => ({ label: p.name, value: p.id }))"
                placeholder="請選擇專案"
              />
            </UFormField>

            <!-- Display name -->
            <UFormField
              label="暱稱（選填）"
              name="displayName"
              description="若不填寫將自動產生匿名暱稱"
            >
              <UInput
                v-model="formState.displayName"
                placeholder="輸入您的暱稱"
              />
            </UFormField>

            <!-- Content -->
            <UFormField
              label="留言內容"
              name="content"
              :error="formErrors.content"
              :description="`${contentLength}/500 字`"
            >
              <UTextarea
                v-model="formState.content"
                placeholder="輸入您想說的話..."
                :rows="5"
              />
            </UFormField>

            <!-- Error message -->
            <UAlert
              v-if="submitError"
              color="error"
              variant="soft"
              :title="submitError"
              icon="i-heroicons-exclamation-triangle"
            />

            <!-- Submit button -->
            <UButton
              type="submit"
              block
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              送出留言
            </UButton>
          </form>
        </UCard>
      </template>
    </div>
  </div>
</template>
