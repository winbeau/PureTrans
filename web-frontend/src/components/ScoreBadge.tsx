type ScoreBadgeProps = {
  score?: number | null;
};

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (typeof score !== 'number') {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
        暂无评分
      </span>
    );
  }

  const className =
    score >= 85
      ? 'border-brand-100 bg-brand-50 text-brand-700'
      : score >= 70
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-red-100 bg-red-50 text-red-700';

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{score} 分</span>;
}
