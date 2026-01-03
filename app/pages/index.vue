<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <UCard class="max-w-md w-full mx-4">
      <div class="text-center space-y-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Mallow Flow
        </h1>
        <p class="text-gray-500">
          直播留言管理平台
        </p>
        <div class="flex flex-col gap-2">
          <UButton to="/dashboard/inbox" block>
            前往收件匣
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
