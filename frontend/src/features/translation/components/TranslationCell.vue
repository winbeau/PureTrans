<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { Check, Copy, Database, Sparkles } from 'lucide-vue-next';
import type { DiffSegmentKind, TranslationRecord } from '../types';

const props = withDefaults(
  defineProps<{
    record: TranslationRecord;
    diffMode?: boolean;
  }>(),
  {
    diffMode: true,
  },
);

const emit = defineEmits<{
  (event: 'copy-source', payload: { id: string; text: string }): void;
}>();

const copied = ref(false);
let copyResetTimer: number | undefined;

const confidencePercent = computed(() => {
  const boundedConfidence = Math.min(1, Math.max(0, props.record.aiConfidence));

  return Math.round(boundedConfidence * 100);
});

const hasDiffSegments = computed(() => props.record.diffMap.length > 0);
const shouldRenderDiff = computed(() => props.diffMode && hasDiffSegments.value);
const matchCount = computed(() => props.record.localContextMatches.length);
const visibleContextMatches = computed(() => props.record.localContextMatches.slice(0, 2));

function diffSegmentClass(kind: DiffSegmentKind): string {
  const baseClass = 'rounded px-0.5 py-px';

  switch (kind) {
    case 'ai-original':
      return `${baseClass} bg-sky-50 text-sky-900 ring-1 ring-inset ring-sky-100`;
    case 'human-edited':
      return `${baseClass} bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-100`;
    case 'removed':
      return `${baseClass} bg-rose-50 text-rose-700 line-through decoration-rose-400 ring-1 ring-inset ring-rose-100`;
    case 'unchanged':
    default:
      return 'text-zinc-800';
  }
}

function contextMatchTitle(label: string, domain?: string, score?: number): string {
  const details: string[] = [];

  if (domain) {
    details.push(domain);
  }

  if (typeof score === 'number') {
    details.push(`score ${score.toFixed(2)}`);
  }

  return details.length > 0 ? `${label} - ${details.join(' - ')}` : label;
}

async function copySourceText(): Promise<void> {
  if (copyResetTimer !== undefined && typeof window !== 'undefined') {
    window.clearTimeout(copyResetTimer);
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    copied.value = false;
    return;
  }

  try {
    await navigator.clipboard.writeText(props.record.sourceText);
    copied.value = true;
    emit('copy-source', { id: props.record.id, text: props.record.sourceText });

    if (typeof window !== 'undefined') {
      copyResetTimer = window.setTimeout(() => {
        copied.value = false;
      }, 1400);
    }
  } catch {
    copied.value = false;
  }
}

onBeforeUnmount(() => {
  if (copyResetTimer !== undefined && typeof window !== 'undefined') {
    window.clearTimeout(copyResetTimer);
  }
});
</script>

<template>
  <article
    class="group overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-sm transition-shadow duration-200 hover:shadow-md"
  >
    <div class="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
      <header class="flex min-w-0 items-center justify-between gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            class="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[11px] font-medium leading-5 text-sky-900"
          >
            <Sparkles class="size-3 shrink-0" aria-hidden="true" />
            AI 贡献度 {{ confidencePercent }}%
          </span>
          <span
            class="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium leading-5 text-zinc-700"
          >
            <Database class="size-3 shrink-0" aria-hidden="true" />
            本地语境命中 {{ matchCount }}
          </span>
        </div>

        <time
          v-if="record.createdAt"
          class="shrink-0 text-[11px] tabular-nums leading-5 text-zinc-400"
          :datetime="record.createdAt"
        >
          {{ record.createdAt }}
        </time>
      </header>

      <section class="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <p class="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Source</p>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            :aria-label="copied ? '原文已复制' : '复制原文'"
            @click="copySourceText"
          >
            <Check v-if="copied" class="size-3.5 text-emerald-600" aria-hidden="true" />
            <Copy v-else class="size-3.5" aria-hidden="true" />
            <span>{{ copied ? 'Copied' : 'Copy' }}</span>
          </button>
        </div>
        <p class="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-800">
          {{ record.sourceText }}
        </p>
      </section>

      <section class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Translation</p>
          <p
            v-if="record.sourceLanguage || record.targetLanguage"
            class="truncate text-[11px] leading-5 text-zinc-400"
          >
            {{ record.sourceLanguage ?? 'auto' }} -> {{ record.targetLanguage ?? 'target' }}
          </p>
        </div>

        <p class="whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-900">
          <template v-if="shouldRenderDiff">
            <span
              v-for="segment in record.diffMap"
              :key="segment.id"
              :class="diffSegmentClass(segment.kind)"
            >
              {{ segment.text }}
            </span>
          </template>
          <template v-else>{{ record.targetText }}</template>
        </p>
      </section>

      <footer v-if="matchCount > 0" class="flex min-w-0 flex-wrap items-center gap-1.5">
        <span
          v-for="match in visibleContextMatches"
          :key="match.id"
          class="inline-flex max-w-full items-center rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium leading-4 text-zinc-600"
          :title="contextMatchTitle(match.label, match.domain, match.score)"
        >
          <span class="truncate">{{ match.label }}</span>
        </span>
        <span
          v-if="matchCount > visibleContextMatches.length"
          class="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium leading-4 text-zinc-500"
        >
          +{{ matchCount - visibleContextMatches.length }}
        </span>
      </footer>
    </div>
  </article>
</template>
