import type { TranslationResult } from '../types/api';

import { CopyButton } from './CopyButton';

type ResultCardProps = {
  title: string;
  result: TranslationResult;
};

export function ResultCard({ title, result }: ResultCardProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-subtle">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {result.direction} / {result.mode === 'kb' ? '知识库' : '直接'}
          </p>
        </div>
        <CopyButton value={result.translated_text} />
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">原文</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border border-line bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {result.source_text}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">译文</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border border-brand-100 bg-brand-50 p-3 text-sm leading-6 text-ink">
            {result.translated_text}
          </p>
        </div>
      </div>

      {result.citations.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">知识库引用</p>
          <div className="mt-2 grid gap-2">
            {result.citations.map((citation) => (
              <article key={citation.source_id} className="rounded-md border border-line bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">{citation.title || citation.source_id}</span>
                  {typeof citation.relevance_score === 'number' ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                      {citation.relevance_score.toFixed(2)}
                    </span>
                  ) : null}
                  {citation.knowledge_domain ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                      {citation.knowledge_domain}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{citation.snippet}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
