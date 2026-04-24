import { useState } from 'react';
import type { FormEvent } from 'react';

import { getErrorMessage } from '../api/client';
import { compareTranslate } from '../api/translation';
import { CopyButton } from '../components/CopyButton';
import { DirectionSelect } from '../components/DirectionSelect';
import { LoadingButton } from '../components/LoadingButton';
import { ResultCard } from '../components/ResultCard';
import { TextAreaField } from '../components/TextAreaField';
import type { CompareTranslationResult, Direction, TranslationResult } from '../types/api';
import { demoExamples } from '../utils/examples';

function fallbackResult(
  result: CompareTranslationResult,
  mode: 'kb' | 'direct',
  translatedText?: string,
): TranslationResult | null {
  if (!translatedText) {
    return null;
  }

  return {
    direction: result.direction,
    source_text: result.source_text,
    translated_text: translatedText,
    mode,
    citations: [],
  };
}

function getKbResult(result: CompareTranslationResult): TranslationResult | null {
  return result.kb_translation || fallbackResult(result, 'kb', result.kb_translated_text);
}

function getDirectResult(result: CompareTranslationResult): TranslationResult | null {
  return result.direct_translation || fallbackResult(result, 'direct', result.direct_translated_text);
}

export function CompareTranslatePage() {
  const [direction, setDirection] = useState<Direction>('中英');
  const [sourceText, setSourceText] = useState(demoExamples[0].sourceText);
  const [result, setResult] = useState<CompareTranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!sourceText.trim()) {
      setError('请输入原文');
      return;
    }

    setLoading(true);
    try {
      const data = await compareTranslate({ direction, source_text: sourceText.trim() });
      setResult(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  const kbResult = result ? getKbResult(result) : null;
  const directResult = result ? getDirectResult(result) : null;

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6">
      <form className="rounded-lg border border-line bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <DirectionSelect value={direction} onChange={setDirection} />
          <TextAreaField label="原文" value={sourceText} onChange={setSourceText} placeholder="输入需要对比翻译的文本" minRows={5} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {demoExamples.map((example) => (
            <button
              key={example.label}
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
              type="button"
              onClick={() => {
                setDirection(example.direction);
                setSourceText(example.sourceText);
                setResult(null);
              }}
            >
              {example.label}
            </button>
          ))}
          <div className="ml-auto">
            <LoadingButton loading={loading}>对比翻译</LoadingButton>
          </div>
        </div>
        {error ? <p className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </form>

      {result && kbResult && directResult ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <ResultCard title="知识库翻译" result={kbResult} />
          <ResultCard title="直接翻译" result={directResult} />
        </div>
      ) : result ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-subtle">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">对比结果</h2>
            <CopyButton value={[kbResult?.translated_text, directResult?.translated_text].filter(Boolean).join('\n\n')} />
          </div>
          <pre className="mt-4 overflow-auto rounded-md border border-line bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-line bg-white/70 p-4 text-sm leading-6 text-slate-500">
          结果将在这里并排显示。
        </section>
      )}
    </main>
  );
}
