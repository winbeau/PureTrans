import type { ReactElement } from 'react';

import type { CheckIssue } from '../types/api';

type HighlightedTextProps = {
  text: string;
  issues: CheckIssue[];
};

type Segment = {
  start: number;
  end: number;
  issue: CheckIssue;
};

function validSegments(text: string, issues: CheckIssue[]): Segment[] {
  return issues
    .flatMap((issue) => {
      const start = issue.start_index;
      const end = issue.end_index;
      if (
        typeof start !== 'number' ||
        typeof end !== 'number' ||
        start < 0 ||
        end <= start ||
        end > text.length
      ) {
        return [];
      }

      return [{ start, end, issue }];
    })
    .sort((a, b) => a.start - b.start)
    .reduce<Segment[]>((segments, segment) => {
      const previous = segments[segments.length - 1];
      if (previous && segment.start < previous.end) {
        return segments;
      }

      segments.push(segment);
      return segments;
    }, []);
}

export function HighlightedText({ text, issues }: HighlightedTextProps) {
  const segments = validSegments(text, issues);

  if (segments.length === 0) {
    return <p className="whitespace-pre-wrap leading-7 text-slate-800">{text || '暂无内容'}</p>;
  }

  const nodes: ReactElement[] = [];
  let cursor = 0;

  segments.forEach((segment, index) => {
    if (segment.start > cursor) {
      nodes.push(<span key={`plain-${index}`}>{text.slice(cursor, segment.start)}</span>);
    }

    nodes.push(
      <mark
        key={`issue-${index}`}
        className="rounded bg-amber-100 px-0.5 text-amber-900"
        title={segment.issue.message || segment.issue.reason || segment.issue.type}
      >
        {text.slice(segment.start, segment.end)}
      </mark>,
    );
    cursor = segment.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="plain-tail">{text.slice(cursor)}</span>);
  }

  return <p className="whitespace-pre-wrap leading-7 text-slate-800">{nodes}</p>;
}
