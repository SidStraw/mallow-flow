<script setup lang="ts">
const email = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/magic-link', {
      method: 'POST',
      body: { email: email.value },
    })
    isSuccess.value = true
  }
  catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }, statusMessage?: string }
    errorMessage.value = e.data?.statusMessage || e.statusMessage || '發送失敗，請稍後再試'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
    <UCard class="max-w-md w-full">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          登入 Mallow Flow
        </h1>
        <p class="mt-2 text-gray-500">
          使用 Magic Link 登入
        </p>
      </div>

      <!-- Success state -->
      <div v-if="isSuccess" class="text-center py-8">
        <UIcon name="i-heroicons-envelope" class="w-12 h-12 text-primary mx-auto" />
        <h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          請檢查您的信箱
        </h2>
        <p class="mt-2 text-gray-500">
          我們已發送登入連結到 {{ email }}
        </p>
      </div>

      <!-- Login form -->
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="輸入您的 Email"
            required
          />
        </UFormField>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="soft"
          :title="errorMessage"
          icon="i-heroicons-exclamation-triangle"
        />

        <UButton
          type="submit"
          block
          :loading="isLoading"
          :disabled="isLoading"
        >
          發送登入連結
        </UButton>
      </form>
    </UCard>
  </div>
</template>
