import type { CheckIssue } from '../types/api';
import { issueTypeLabel, severityClassName, severityLabel } from '../utils/issueLabels';

type IssueCardProps = {
  issue: CheckIssue;
  index: number;
};

export function IssueCard({ issue, index }: IssueCardProps) {
  const message = issue.message || issue.reason || '未提供问题说明';
  const suggestion = issue.suggestion || issue.suggested_text;

  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
        <span className="rounded-full border border-note-100 bg-note-50 px-2 py-0.5 text-xs font-medium text-note-700">
          {issueTypeLabel(issue.type)}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityClassName(issue.severity)}`}>
          {severityLabel(issue.severity)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-800">{message}</p>
      {suggestion ? (
        <p className="mt-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm leading-6 text-brand-700">
          {suggestion}
        </p>
      ) : null}
    </article>
  );
}
