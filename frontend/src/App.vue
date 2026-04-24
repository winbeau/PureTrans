<script setup lang="ts">
import { computed, onMounted } from 'vue';

import AuthLanding from './features/auth/components/AuthLanding.vue';
import { createWeChatAuthController } from './features/auth/composables/useWeChatAuth';
import TranslationMain from './features/translation/components/TranslationMain.vue';


const authController = createWeChatAuthController();

const isBusy = computed(
  () => authController.state.value.status === 'starting' || authController.state.value.status === 'exchanging',
);
const authError = computed(() => (authController.state.value.status === 'error' ? authController.state.value.error : null));
const isAuthenticated = computed(() => authController.state.value.status === 'authenticated');
const authenticatedUser = computed(() => {
  const authState = authController.state.value;
  return authState.status === 'authenticated' ? authState.user : null;
});

onMounted(() => {
  void authController.initialize();
});
</script>

<template>
  <div v-if="!authController.isReady.value" class="flex min-h-dvh items-center justify-center bg-github-canvas text-sm text-github-muted dark:bg-github-dark-canvas dark:text-github-dark-muted">
    正在恢复登录状态…
  </div>
  <TranslationMain
    v-else-if="isAuthenticated"
    :current-user="authenticatedUser"
    @logout="authController.logout"
  />
  <AuthLanding
    v-else
    :is-busy="isBusy"
    :error="authError"
    :wechat-configured="authController.health.value?.wechatConfigured ?? false"
    @login="authController.login"
  />
</template>
