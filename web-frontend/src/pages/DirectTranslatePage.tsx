import { useState } from 'react';
import type { FormEvent } from 'react';

import { getErrorMessage } from '../api/client';
import { translateDirect } from '../api/translation';
import { DirectionSelect } from '../components/DirectionSelect';
import { LoadingButton } from '../components/LoadingButton';
import { ResultCard } from '../components/ResultCard';
import { TextAreaField } from '../components/TextAreaField';
import type { Direction, TranslationResult } from '../types/api';
import { demoExamples } from '../utils/examples';

export function DirectTranslatePage() {
  const [direction, setDirection] = useState<Direction>('中英');
  const [sourceText, setSourceText] = useState(demoExamples[1].sourceText);
  const [result, setResult] = useState<TranslationResult | null>(null);
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
      const data = await translateDirect({ direction, source_text: sourceText.trim() });
      setResult(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form className="rounded-lg border border-line bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <DirectionSelect value={direction} onChange={setDirection} />
          <TextAreaField label="原文" value={sourceText} onChange={setSourceText} placeholder="输入需要直接翻译的文本" />
          <div className="flex flex-wrap gap-2">
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
          </div>
          {error ? <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <LoadingButton loading={loading}>直接翻译</LoadingButton>
        </div>
      </form>

      {result ? (
        <ResultCard title="直接译文" result={result} />
      ) : (
        <section className="rounded-lg border border-dashed border-line bg-white/70 p-4 text-sm leading-6 text-slate-500">
          结果将在这里显示，便于和知识库翻译对照。
        </section>
      )}
    </main>
  );
}
