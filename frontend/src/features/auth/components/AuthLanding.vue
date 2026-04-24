<script setup lang="ts">
import { AlertTriangle, LoaderCircle, ShieldCheck } from 'lucide-vue-next';

import type { AuthError } from '../types';


defineProps<{
  isBusy: boolean;
  error: AuthError | null;
  wechatConfigured: boolean;
}>();

defineEmits<{
  login: [];
}>();
</script>

<template>
  <main class="relative min-h-dvh overflow-hidden bg-github-canvas px-5 text-github-fg dark:bg-github-dark-canvas dark:text-github-dark-fg">
    <div
      class="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(9,105,218,0.12),transparent_62%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,139,253,0.18),transparent_58%)]"
      aria-hidden="true"
    />

    <section class="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-between pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top)+2rem)]">
      <div class="space-y-5">
        <div class="inline-flex items-center gap-2 rounded-full border border-github-border bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-github-muted shadow-sm dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-muted">
          <ShieldCheck class="size-4 text-github-accent dark:text-github-dark-accent" aria-hidden="true" />
          <span>清译</span>
        </div>

        <div class="space-y-3">
          <h1 class="text-3xl font-semibold tracking-tight text-github-fg dark:text-github-dark-fg">微信登录后进入语境校验翻译</h1>
          <p class="max-w-lg text-sm leading-7 text-github-muted dark:text-github-dark-muted">
            微信登录仅用于换取清译应用会话。翻译上下文、RAG 引用和不确定性提示仍由后端统一编排，不会把微信原始返回直接暴露给前端。
          </p>
        </div>

        <div class="grid gap-3">
          <article class="rounded-[1.5rem] border border-github-border bg-white/95 p-4 shadow-[0_1px_0_rgba(27,31,36,0.04)] dark:border-github-dark-border dark:bg-github-dark-subtle">
            <p class="text-sm font-medium text-github-fg dark:text-github-dark-fg">登录后可继续使用</p>
            <p class="mt-2 text-sm leading-6 text-github-muted dark:text-github-dark-muted">
              语境感知翻译、区域知识检索、移动端语音交互，以及后续统一的应用会话令牌。
            </p>
          </article>

          <article
            v-if="!wechatConfigured || error"
            class="rounded-[1.5rem] border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-900 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100"
          >
            <div class="flex items-start gap-3">
              <AlertTriangle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div class="space-y-1.5">
                <p class="font-medium">{{ !wechatConfigured ? '后端未完成微信登录配置' : '当前登录不可用' }}</p>
                <p class="leading-6 opacity-90">
                  {{ error?.message ?? '请补齐 PURETRANS_WECHAT_APP_ID、PURETRANS_WECHAT_APP_SECRET 与认证签名配置后重试。' }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="space-y-3">
        <button
          type="button"
          class="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-github-fg text-sm font-semibold text-white transition hover:bg-[#2f353d] disabled:cursor-not-allowed disabled:bg-github-muted/40 dark:bg-github-dark-fg dark:text-github-dark-canvas dark:hover:bg-white dark:hover:text-github-dark-canvas dark:disabled:bg-github-dark-muted/30"
          :disabled="isBusy || !wechatConfigured"
          @click="$emit('login')"
        >
          <LoaderCircle v-if="isBusy" class="size-4 animate-spin" aria-hidden="true" />
          <span>{{ isBusy ? '正在拉起微信授权…' : '使用微信登录' }}</span>
        </button>

        <p class="text-center text-xs leading-5 text-github-muted dark:text-github-dark-muted">
          当前 Android 首版仅接入微信授权登录，退出登录只会清理本地清译会话。
        </p>
      </div>
    </section>
  </main>
</template>
