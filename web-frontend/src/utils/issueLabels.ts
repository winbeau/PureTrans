export function issueTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    terminology: '术语',
    grammar: '语法',
    omission: '漏译',
    addition: '增译',
    mistranslation: '误译',
    fluency: '流畅度',
    style: '风格',
    context: '上下文',
  };

  return labels[type] || type;
}

export function severityLabel(severity?: string | null): string {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重',
  };

  if (!severity) {
    return '未标注';
  }

  return labels[severity] || severity;
}

export function severityClassName(severity?: string | null): string {
  if (severity === 'high' || severity === 'critical') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (severity === 'medium') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
}
