import { useState } from 'react';
import type { FormEvent } from 'react';

import { getErrorMessage } from '../api/client';
import { checkTranslation } from '../api/translation';
import { CopyButton } from '../components/CopyButton';
import { DirectionSelect } from '../components/DirectionSelect';
import { HighlightedText } from '../components/HighlightedText';
import { IssueCard } from '../components/IssueCard';
import { LoadingButton } from '../components/LoadingButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { TextAreaField } from '../components/TextAreaField';
import type { CheckResult, Direction } from '../types/api';
import { demoExamples } from '../utils/examples';

function revisedText(result: CheckResult): string {
  return result.revised_text || result.revisedText || '';
}

export function CheckTranslationPage() {
  const [direction, setDirection] = useState<Direction>('中英');
  const [sourceText, setSourceText] = useState(demoExamples[0].sourceText);
  const [targetText, setTargetText] = useState(demoExamples[0].targetText);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!sourceText.trim() || !targetText.trim()) {
      setError('请输入原文和译文');
      return;
    }

    setLoading(true);
    try {
      const data = await checkTranslation({
        direction,
        source_text: sourceText.trim(),
        target_text: targetText.trim(),
      });
      setResult(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  const hasErrors = result ? result.has_errors ?? result.issues.length > 0 : false;
  const revised = result ? revisedText(result) : '';

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form className="rounded-lg border border-line bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <DirectionSelect value={direction} onChange={setDirection} />
          <TextAreaField label="原文" value={sourceText} onChange={setSourceText} placeholder="输入原文" minRows={5} />
          <TextAreaField label="待校验译文" value={targetText} onChange={setTargetText} placeholder="输入译文" minRows={5} />
          <div className="flex flex-wrap gap-2">
            {demoExamples.map((example) => (
              <button
                key={example.label}
                className="rounded-full border border-line px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700"
                type="button"
                onClick={() => {
                  setDirection(example.direction);
                  setSourceText(example.sourceText);
                  setTargetText(example.targetText);
                  setResult(null);
                }}
              >
                {example.label}
              </button>
            ))}
          </div>
          {error ? <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <LoadingButton loading={loading}>校验译文</LoadingButton>
        </div>
      </form>

      {result ? (
        <section className="rounded-lg border border-line bg-white p-4 shadow-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink">校验结果</h2>
              <p className="mt-0.5 text-xs text-slate-500">{hasErrors ? '发现需要处理的问题' : '未发现明显问题'}</p>
            </div>
            <ScoreBadge score={result.overall_score} />
          </div>

          <div className="mt-4 rounded-md border border-line bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">待校验译文</p>
            <HighlightedText text={result.target_text} issues={result.issues} />
          </div>

          {revised ? (
            <div className="mt-4 rounded-md border border-brand-100 bg-brand-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-brand-700">修订建议</p>
                <CopyButton value={revised} />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{revised}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3">
            {result.issues.length > 0 ? (
              result.issues.map((issue, index) => <IssueCard key={`${issue.type}-${index}`} issue={issue} index={index} />)
            ) : (
              <p className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">暂无问题</p>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-line bg-white/70 p-4 text-sm leading-6 text-slate-500">
          校验结果将在这里显示，包括问题列表、可用高亮和修订译文。
        </section>
      )}
    </main>
  );
}
