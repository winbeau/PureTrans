<script setup lang="ts">
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard as CapacitorKeyboard } from '@capacitor/keyboard';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Inbox,
  Keyboard,
  LogOut,
  Mic,
  Moon,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
  UserRound,
} from 'lucide-vue-next';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AuthenticatedUser } from '../../auth/types';


const props = defineProps<{
  currentUser?: AuthenticatedUser | null;
}>();

const emit = defineEmits<{
  logout: [];
}>();

type InputMode = 'voice' | 'text';

type HistoryItem = {
  id: string;
  original: string;
  translated: string;
};

const initialHistory: HistoryItem[] = [
  {
    id: 'history-remission',
    original: 'The patient entered remission after the third treatment cycle.',
    translated: '患者在第三个疗程后进入缓释期。',
  },
  {
    id: 'history-muqam',
    original: 'Muqam remains one of the most recognized cultural forms in Xinjiang.',
    translated: '十二木卡姆仍是新疆最具辨识度的文化形态之一。',
  },
  {
    id: 'history-naan',
    original: 'Fresh Naan is sold near the old city market every morning.',
    translated: '老城集市附近每天早晨都会售卖新鲜烤馕。',
  },
  {
    id: 'history-policy',
    original: 'Bilingual service guidelines should remain visible at the township station.',
    translated: '双语办事指引应持续张贴在乡镇服务站醒目位置。',
  },
];

const translationEngine = ref('清译校验 v2');
const isDark = ref(false);
const inputMode = ref<InputMode>('voice');
const isRecording = ref(false);
const isSettingsOpen = ref(false);
const isHistoryOpen = ref(false);
const isRagEnabled = ref(true);
const draftText = ref('');
const searchQuery = ref('');
const historyDatabase = ref<HistoryItem[]>([...initialHistory]);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const keyboardInset = ref(0);
const keyboardListenerHandles: PluginListenerHandle[] = [];
const pendingTimerIds: number[] = [];
const recentItems = computed(() => historyDatabase.value.slice(0, 3));
const baseContentBottomPadding = 'calc(env(safe-area-inset-bottom) + 8.5rem)';
const textContentBottomPadding = 'calc(env(safe-area-inset-bottom) + 13rem)';
const inputPanelBottom = computed(() => `${keyboardInset.value > 0 ? keyboardInset.value + 12 : 104}px`);
const contentBottomPadding = computed(() => {
  if (keyboardInset.value > 0) {
    return `calc(env(safe-area-inset-bottom) + ${keyboardInset.value}px + 13rem)`;
  }

  return inputMode.value === 'text' ? textContentBottomPadding : baseContentBottomPadding;
});

const filteredHistory = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) {
    return historyDatabase.value;
  }

  return historyDatabase.value.filter((item) => {
    const original = item.original.toLowerCase();
    const translated = item.translated.toLowerCase();

    return original.includes(query) || translated.includes(query);
  });
});

const accountLocation = computed(() => {
  const segments = [props.currentUser?.city, props.currentUser?.province, props.currentUser?.country].filter(Boolean);
  return segments.join(' · ');
});

const canSubmitText = computed(() => draftText.value.trim().length > 0);

function syncThemeClass(): void {
  document.documentElement.classList.toggle('dark', isDark.value);
}

function toggleTheme(): void {
  isDark.value = !isDark.value;
  syncThemeClass();
}

function openSettings(): void {
  isSettingsOpen.value = true;
}

function closeSettings(): void {
  isSettingsOpen.value = false;
}

function openHistory(): void {
  isHistoryOpen.value = true;
}

function closeHistory(): void {
  isHistoryOpen.value = false;
}

function switchInputMode(mode: InputMode): void {
  inputMode.value = mode;

  if (mode === 'voice') {
    textareaRef.value?.blur();

    if (Capacitor.getPlatform() === 'android') {
      void CapacitorKeyboard.hide().catch(() => undefined);
    }
  }
}

function focusTextInput(): void {
  nextTick(() => {
    textareaRef.value?.focus();
  });
}

function beginRecording(): void {
  if (inputMode.value !== 'voice') {
    return;
  }

  isRecording.value = true;
}

function endRecording(): void {
  isRecording.value = false;
}

function resetTextareaHeight(): void {
  const textarea = textareaRef.value;

  if (!textarea) {
    return;
  }

  textarea.style.height = '0px';
  const nextHeight = Math.min(textarea.scrollHeight, 160);
  textarea.style.height = `${Math.max(nextHeight, 44)}px`;
}

function applyKeyboardInset(height: number): void {
  keyboardInset.value = Math.max(0, Math.round(height));
}

async function registerKeyboardListeners(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    applyKeyboardInset(0);
    return;
  }

  const handles = await Promise.all([
    CapacitorKeyboard.addListener('keyboardWillShow', (info) => {
      applyKeyboardInset(info.keyboardHeight);
    }),
    CapacitorKeyboard.addListener('keyboardDidShow', (info) => {
      applyKeyboardInset(info.keyboardHeight);
    }),
    CapacitorKeyboard.addListener('keyboardWillHide', () => {
      applyKeyboardInset(0);
    }),
    CapacitorKeyboard.addListener('keyboardDidHide', () => {
      applyKeyboardInset(0);
    }),
  ]);

  keyboardListenerHandles.push(...handles);
}

function buildMockTranslation(sourceText: string): string {
  const normalized = sourceText.trim();
  const lowerSource = normalized.toLowerCase();

  if (lowerSource.includes('remission')) {
    return '术语已按医学语境校正为缓释期，并保留后续随访语义。';
  }

  if (lowerSource.includes('muqam') || lowerSource.includes('naan')) {
    if (lowerSource.includes('muqam') && lowerSource.includes('naan')) {
      return '已根据新疆本地知识库保留十二木卡姆与烤馕等专名表达。';
    }

    if (lowerSource.includes('muqam')) {
      return '已根据新疆本地知识库保留十二木卡姆等专名表达。';
    }

    return '已根据新疆本地知识库保留烤馕等专名表达。';
  }

  if (/[\u4e00-\u9fa5]/.test(normalized)) {
    return '已完成语境校验，并保留新疆本地化术语。';
  }

  return '已完成语境审校，替换直译表达并补足专名信息。';
}

function isPendingHistory(item: HistoryItem): boolean {
  return item.translated === '处理中…';
}

function submitText(): void {
  if (!canSubmitText.value) {
    return;
  }

  const sourceText = draftText.value.trim();
  const id = `record-${Date.now()}`;
  const placeholderHistory: HistoryItem = {
    id,
    original: sourceText,
    translated: '处理中…',
  };

  historyDatabase.value = [placeholderHistory, ...historyDatabase.value];
  draftText.value = '';

  nextTick(() => {
    resetTextareaHeight();
  });

  const timerId = window.setTimeout(() => {
    const translated = buildMockTranslation(sourceText);

    historyDatabase.value = historyDatabase.value.map((item) =>
      item.id === id
        ? {
            ...item,
            translated,
          }
        : item,
    );
  }, 1200);

  pendingTimerIds.push(timerId);
}

function clearMockCache(): void {
  historyDatabase.value = [...initialHistory];
  searchQuery.value = '';
  draftText.value = '';
  closeSettings();
  nextTick(() => {
    resetTextareaHeight();
  });
}

function logout(): void {
  closeSettings();
  emit('logout');
}

watch(inputMode, async (mode) => {
  if (mode === 'text') {
    await nextTick();
    resetTextareaHeight();
    return;
  }

  isRecording.value = false;
});

watch(draftText, () => {
  if (inputMode.value === 'text') {
    nextTick(resetTextareaHeight);
  }
});

onMounted(() => {
  document.documentElement.classList.remove('dark');
  syncThemeClass();
  resetTextareaHeight();
  void registerKeyboardListeners();
});

onBeforeUnmount(() => {
  pendingTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  document.documentElement.classList.remove('dark');
  keyboardListenerHandles.forEach((handle) => {
    void handle.remove();
  });
});
</script>

<template>
  <main class="relative min-h-dvh overflow-hidden bg-github-canvas text-github-fg transition-colors duration-200 dark:bg-github-dark-canvas dark:text-github-dark-fg">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(9,105,218,0.08),transparent_62%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,139,253,0.14),transparent_60%)]"
      aria-hidden="true"
    />

    <header
      class="fixed inset-x-0 top-0 z-30 border-b border-github-border/80 bg-github-canvas/92 px-4 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-github-dark-border dark:bg-github-dark-canvas/92"
    >
      <div class="relative mx-auto flex max-w-xl items-center justify-between py-3">
        <button
          type="button"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-github-border bg-github-subtle text-github-muted transition hover:bg-github-accent/10 hover:text-github-fg dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-muted dark:hover:bg-github-dark-accent/10 dark:hover:text-github-dark-fg"
          aria-label="打开记录"
          @click="openHistory"
        >
          <Clock class="size-[18px]" aria-hidden="true" />
        </button>

        <div class="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center slide-up">
          <div
            class="inline-flex min-w-0 items-center rounded-full border border-github-border bg-github-subtle px-4 py-2 text-sm shadow-sm dark:border-github-dark-border dark:bg-github-dark-subtle"
          >
            <span class="truncate font-semibold tracking-tight">PureTrans</span>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-github-border bg-github-subtle text-github-muted transition hover:bg-github-accent/10 hover:text-github-fg dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-muted dark:hover:bg-github-dark-accent/10 dark:hover:text-github-dark-fg"
          aria-label="打开用户页面"
          @click="openSettings"
        >
          <img
            v-if="props.currentUser?.avatarUrl"
            :src="props.currentUser.avatarUrl"
            :alt="props.currentUser.nickname"
            class="size-full object-cover"
          />
          <UserRound v-else class="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </header>

    <section
      class="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pt-[calc(env(safe-area-inset-top)+5.5rem)]"
      :style="{ paddingBottom: contentBottomPadding }"
    >
      <div class="flex flex-1 flex-col gap-3 overflow-y-auto pb-6 pr-1 hide-scrollbar">
        <template v-if="recentItems.length">
          <article
            v-for="(item, index) in recentItems"
            :key="item.id"
            class="rounded-[1.5rem] border border-github-border bg-white/96 p-4 shadow-[0_1px_0_rgba(27,31,36,0.04)] slide-up dark:border-github-dark-border dark:bg-github-dark-subtle"
            :style="{ animationDelay: `${index * 70}ms` }"
          >
            <div class="flex items-center justify-end">
              <span
                v-if="isPendingHistory(item)"
                class="size-2.5 rounded-full bg-amber-500 dark:bg-amber-400"
                aria-label="翻译处理中"
              />
            </div>

            <p class="mt-3 text-lg font-semibold leading-8 tracking-tight text-github-fg dark:text-github-dark-fg">
              {{ item.translated }}
            </p>

            <div class="mt-4 rounded-[1.2rem] border border-github-border bg-github-subtle px-3.5 py-3 dark:border-github-dark-border dark:bg-github-dark-canvas">
              <p class="text-[13px] leading-6 text-github-muted dark:text-github-dark-muted">
                {{ item.original }}
              </p>
            </div>
          </article>
        </template>

        <div
          v-else
          class="flex flex-1 items-center justify-center rounded-[1.75rem] border border-dashed border-github-border bg-github-subtle px-6 text-center text-sm text-github-muted dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-muted"
        >
          暂无最近记录
        </div>
      </div>
    </section>

    <Transition name="slide-up-bottom">
      <div
        v-if="inputMode === 'text'"
        class="pointer-events-none fixed inset-x-0 z-20 px-4"
        :style="{ bottom: inputPanelBottom }"
      >
        <div class="pointer-events-auto mx-auto max-w-xl">
          <div
            class="rounded-[1.4rem] border border-github-border bg-white p-2 shadow-[0_18px_40px_rgba(27,31,36,0.14)] dark:border-github-dark-border dark:bg-github-dark-subtle"
          >
            <div class="flex items-end gap-2">
              <textarea
                ref="textareaRef"
                v-model="draftText"
                rows="1"
                class="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-github-fg outline-none placeholder:text-github-muted dark:text-github-dark-fg dark:placeholder:text-github-dark-muted"
                placeholder="粘贴要做语境校验的文本…"
                @keydown.enter.exact.prevent="submitText"
              />
              <button
                type="button"
                class="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-github-fg text-white transition disabled:cursor-not-allowed disabled:bg-github-muted/30 dark:bg-github-dark-fg dark:text-github-dark-canvas dark:disabled:bg-github-dark-muted/20"
                :disabled="!canSubmitText"
                aria-label="发送文本"
                @click="submitText"
              >
                <Send class="size-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <footer
      class="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pt-3"
    >
      <div
        class="pointer-events-auto mx-auto flex max-w-xl items-center gap-3 rounded-[1.75rem] border border-github-border/80 bg-github-canvas/94 px-3 py-3 shadow-[0_-14px_30px_rgba(27,31,36,0.12)] backdrop-blur dark:border-github-dark-border dark:bg-github-dark-canvas/94 dark:shadow-[0_-18px_34px_rgba(1,4,9,0.42)]"
        :class="inputMode === 'voice' ? 'pb-[max(0.9rem,env(safe-area-inset-bottom))]' : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'"
      >
        <button
          type="button"
          class="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-github-subtle text-github-muted transition hover:bg-white hover:text-github-fg dark:bg-github-dark-subtle dark:text-github-dark-muted dark:hover:bg-github-dark-canvas dark:hover:text-github-dark-fg"
          aria-label="打开设置"
          @click="openSettings"
        >
          <Settings class="size-5" aria-hidden="true" />
        </button>

        <button
          v-if="inputMode === 'voice'"
          type="button"
          class="no-callout group relative flex h-[4.5rem] min-w-0 flex-1 select-none touch-manipulation items-center justify-center overflow-hidden rounded-[1.65rem] border border-github-border/80 bg-white text-github-fg shadow-[0_12px_28px_rgba(27,31,36,0.12)] transition duration-200 active:scale-[0.985] focus:outline-none dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-fg dark:shadow-[0_12px_30px_rgba(1,4,9,0.32)]"
          :class="
            isRecording
              ? 'border-github-accent/40 bg-github-accent/10 text-github-accent dark:border-github-dark-accent/50 dark:bg-github-dark-accent/16 dark:text-github-dark-accent'
              : 'hover:border-github-border hover:bg-github-subtle dark:hover:border-github-dark-border dark:hover:bg-github-dark-canvas'
          "
          :aria-pressed="isRecording"
          aria-label="按住录音"
          @contextmenu.prevent
          @dragstart.prevent
          @selectstart.prevent
          @pointerdown.prevent="beginRecording"
          @pointerup.prevent="endRecording"
          @pointercancel.prevent="endRecording"
          @pointerleave.prevent="endRecording"
        >
          <span
            class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(9,105,218,0.12),transparent_62%)] opacity-80 dark:bg-[radial-gradient(circle_at_top,_rgba(56,139,253,0.16),transparent_58%)]"
            aria-hidden="true"
          />
          <span
            v-if="isRecording"
            class="pointer-events-none absolute inset-x-1/2 top-1/2 size-[4.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full wave-anim bg-github-accent/12 dark:bg-github-dark-accent/18"
            aria-hidden="true"
          />
          <span class="pointer-events-none relative z-[1] flex items-center gap-3 px-4">
            <span
              class="inline-flex size-12 items-center justify-center transition"
              :class="isRecording ? 'scale-105' : 'group-active:scale-95'"
            >
              <Mic class="size-7" aria-hidden="true" />
            </span>
            <span class="flex flex-col items-start text-left">
              <span class="text-[13px] font-semibold leading-5 tracking-tight">
                {{ isRecording ? '正在录音…' : '按住说话' }}
              </span>
              <span class="text-[11px] leading-4 text-github-muted dark:text-github-dark-muted">
                {{ isRecording ? '松开后结束' : '按住期间持续说话' }}
              </span>
            </span>
          </span>
        </button>

        <button
          v-else
          type="button"
          class="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-2xl bg-github-subtle text-github-muted transition hover:bg-white hover:text-github-fg dark:bg-github-dark-subtle dark:text-github-dark-muted dark:hover:bg-github-dark-canvas dark:hover:text-github-dark-fg"
          aria-label="聚焦文本输入"
          @click="focusTextInput"
        >
          <Keyboard class="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-github-subtle text-github-muted transition hover:bg-white hover:text-github-fg dark:bg-github-dark-subtle dark:text-github-dark-muted dark:hover:bg-github-dark-canvas dark:hover:text-github-dark-fg"
          :aria-label="inputMode === 'voice' ? '切换到文本输入' : '切换到语音输入'"
          @click="switchInputMode(inputMode === 'voice' ? 'text' : 'voice')"
        >
          <Keyboard v-if="inputMode === 'voice'" class="size-5" aria-hidden="true" />
          <Mic v-else class="size-5" aria-hidden="true" />
        </button>
      </div>
    </footer>

    <Transition name="fade">
      <div
        v-if="isSettingsOpen"
        class="fixed inset-0 z-40 bg-github-overlay/55 dark:bg-github-dark-overlay/72"
        @click="closeSettings"
      />
    </Transition>

    <Transition name="slide-up-bottom">
      <section
        v-if="isSettingsOpen"
        class="fixed inset-x-0 bottom-0 z-50 rounded-t-[1.75rem] border-t border-github-border bg-github-canvas px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_60px_rgba(27,31,36,0.24)] dark:border-github-dark-border dark:bg-github-dark-canvas"
        aria-label="设置面板"
      >
        <div class="mx-auto max-w-xl">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="inline-flex items-center gap-2">
              <SlidersHorizontal class="size-[18px] text-github-muted dark:text-github-dark-muted" aria-hidden="true" />
              <h2 class="text-sm font-semibold text-github-fg dark:text-github-dark-fg">账号与设置</h2>
            </div>
            <button
              type="button"
              class="inline-flex size-9 items-center justify-center rounded-xl border border-github-border bg-github-subtle text-github-muted dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-muted"
              aria-label="关闭设置"
              @click="closeSettings"
            >
              <X class="size-4" aria-hidden="true" />
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-if="props.currentUser"
              class="flex items-center gap-3 rounded-2xl border border-github-border bg-white px-4 py-4 dark:border-github-dark-border dark:bg-github-dark-subtle"
            >
              <div
                v-if="props.currentUser.avatarUrl"
                class="size-11 overflow-hidden rounded-2xl border border-github-border bg-github-subtle dark:border-github-dark-border dark:bg-github-dark-canvas"
              >
                <img :src="props.currentUser.avatarUrl" :alt="props.currentUser.nickname" class="size-full object-cover" />
              </div>
              <div
                v-else
                class="inline-flex size-11 items-center justify-center rounded-2xl border border-github-border bg-github-subtle text-github-muted dark:border-github-dark-border dark:bg-github-dark-canvas dark:text-github-dark-muted"
              >
                <UserRound class="size-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-github-fg dark:text-github-dark-fg">{{ props.currentUser.nickname }}</p>
                <p class="truncate text-xs text-github-muted dark:text-github-dark-muted">
                  {{ accountLocation || props.currentUser.openId }}
                </p>
              </div>
            </div>

            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-github-border bg-white px-4 py-4 text-left dark:border-github-dark-border dark:bg-github-dark-subtle"
              @click="toggleTheme"
            >
              <div class="inline-flex size-10 items-center justify-center rounded-xl bg-github-subtle text-github-muted dark:bg-github-dark-canvas dark:text-github-dark-muted">
                <Moon v-if="isDark" class="size-[18px]" aria-hidden="true" />
                <Sun v-else class="size-[18px]" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-github-fg dark:text-github-dark-fg">界面主题</p>
                <p class="text-xs text-github-muted dark:text-github-dark-muted">
                  {{ isDark ? '深色模式已开启' : '浅色模式已开启' }}
                </p>
              </div>
              <span
                class="inline-flex h-7 w-12 items-center rounded-full p-1 transition"
                :class="
                  isDark
                    ? 'bg-github-dark-fg justify-end'
                    : 'bg-github-border dark:bg-github-dark-border'
                "
              >
                <span class="size-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-github-border bg-white px-4 py-4 text-left dark:border-github-dark-border dark:bg-github-dark-subtle"
            >
              <div class="inline-flex size-10 items-center justify-center rounded-xl bg-github-subtle text-github-muted dark:bg-github-dark-canvas dark:text-github-dark-muted">
                <Cpu class="size-[18px]" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-github-fg dark:text-github-dark-fg">翻译引擎</p>
                <p class="truncate text-xs text-github-muted dark:text-github-dark-muted">{{ translationEngine }}</p>
              </div>
              <ChevronRight class="size-4 shrink-0 text-github-muted dark:text-github-dark-muted" aria-hidden="true" />
            </button>

            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-github-border bg-white px-4 py-4 text-left dark:border-github-dark-border dark:bg-github-dark-subtle"
              @click="isRagEnabled = !isRagEnabled"
            >
              <div class="inline-flex size-10 items-center justify-center rounded-xl bg-github-subtle text-github-muted dark:bg-github-dark-canvas dark:text-github-dark-muted">
                <Database class="size-[18px]" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-github-fg dark:text-github-dark-fg">本地知识库</p>
                <p class="text-xs text-github-muted dark:text-github-dark-muted">
                  {{ isRagEnabled ? '已用于术语校准与本地知识检索' : '当前已关闭，仅保留模拟审校' }}
                </p>
              </div>
              <span
                class="inline-flex h-7 w-12 items-center rounded-full p-1 transition"
                :class="
                  isRagEnabled
                    ? 'bg-emerald-500/90 justify-end'
                    : 'bg-github-border dark:bg-github-dark-border'
                "
              >
                <span class="size-5 rounded-full bg-white shadow-sm" />
              </span>
            </button>

            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 text-left dark:border-rose-400/20 dark:bg-rose-500/10"
              @click="clearMockCache"
            >
              <div class="inline-flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                <Trash2 class="size-[18px]" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-github-fg dark:text-github-dark-fg">清空缓存</p>
                <p class="text-xs text-github-muted dark:text-github-dark-muted">重置当前模拟记录与历史</p>
              </div>
              <ChevronRight class="size-4 shrink-0 text-github-muted dark:text-github-dark-muted" aria-hidden="true" />
            </button>

            <button
              v-if="props.currentUser"
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border border-github-border bg-white px-4 py-4 text-left dark:border-github-dark-border dark:bg-github-dark-subtle"
              @click="logout"
            >
              <div class="inline-flex size-10 items-center justify-center rounded-xl bg-github-subtle text-github-muted dark:bg-github-dark-canvas dark:text-github-dark-muted">
                <LogOut class="size-[18px]" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-github-fg dark:text-github-dark-fg">退出登录</p>
                <p class="text-xs text-github-muted dark:text-github-dark-muted">从当前设备移除本地清译会话</p>
              </div>
              <ChevronRight class="size-4 shrink-0 text-github-muted dark:text-github-dark-muted" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <Transition name="slide-right">
      <section
        v-if="isHistoryOpen"
        class="fixed inset-0 z-[60] flex min-h-dvh flex-col bg-github-canvas px-4 pt-[env(safe-area-inset-top)] dark:bg-github-dark-canvas"
        aria-label="翻译记录"
      >
        <div class="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <div class="flex items-center gap-3 border-b border-github-border py-3 dark:border-github-dark-border">
            <button
              type="button"
              class="inline-flex size-10 items-center justify-center rounded-xl border border-github-border bg-github-subtle text-github-muted dark:border-github-dark-border dark:bg-github-dark-subtle dark:text-github-dark-muted"
              aria-label="关闭记录"
              @click="closeHistory"
            >
              <ChevronLeft class="size-[18px]" aria-hidden="true" />
            </button>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-github-fg dark:text-github-dark-fg">翻译记录</p>
              <p class="text-xs text-github-muted dark:text-github-dark-muted">
                {{ filteredHistory.length }} 条记录
              </p>
            </div>
          </div>

          <div class="py-4">
            <label
              class="flex items-center gap-2 rounded-2xl border border-github-border bg-white px-3 py-3 dark:border-github-dark-border dark:bg-github-dark-subtle"
            >
              <Search class="size-4 shrink-0 text-github-muted dark:text-github-dark-muted" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                class="w-full border-0 bg-transparent text-sm text-github-fg outline-none placeholder:text-github-muted dark:text-github-dark-fg dark:placeholder:text-github-dark-muted"
                placeholder="搜索原文或译文"
              />
            </label>
          </div>

          <div class="hide-scrollbar flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div v-if="filteredHistory.length" class="space-y-3">
              <article
                v-for="item in filteredHistory"
                :key="item.id"
                class="rounded-[1.5rem] border border-github-border bg-white p-4 dark:border-github-dark-border dark:bg-github-dark-subtle"
              >
                <div class="flex items-center justify-end">
                  <span
                    v-if="isPendingHistory(item)"
                    class="size-2.5 rounded-full bg-amber-500 dark:bg-amber-400"
                    aria-label="翻译处理中"
                  />
                </div>
                <p class="mt-3 text-base font-semibold leading-7 text-github-fg dark:text-github-dark-fg">{{ item.translated }}</p>
                <div class="mt-4 rounded-[1.2rem] border border-github-border bg-github-subtle px-3.5 py-3 dark:border-github-dark-border dark:bg-github-dark-canvas">
                  <p class="text-[13px] leading-6 text-github-muted dark:text-github-dark-muted">{{ item.original }}</p>
                </div>
              </article>
            </div>

            <div
              v-else
              class="flex h-full min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-github-border bg-github-subtle px-6 text-center dark:border-github-dark-border dark:bg-github-dark-subtle"
            >
              <Inbox class="size-8 text-github-muted dark:text-github-dark-muted" aria-hidden="true" />
              <div>
                <p class="text-sm font-semibold text-github-fg dark:text-github-dark-fg">没有匹配的记录</p>
                <p class="mt-1 text-xs text-github-muted dark:text-github-dark-muted">
                  换个关键词，或先新增一条模拟翻译。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Transition>
  </main>
</template>
