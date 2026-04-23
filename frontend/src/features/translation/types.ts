export type DiffSegmentKind = 'unchanged' | 'ai-original' | 'human-edited' | 'removed';

export interface TranslationDiffSegment {
  id: string;
  text: string;
  kind: DiffSegmentKind;
}

export interface LocalContextMatch {
  id: string;
  label: string;
  sourceId?: string;
  score?: number;
  domain?: string;
}

export interface TranslationRecord {
  id: string;
  sourceText: string;
  targetText: string;
  diffMap: TranslationDiffSegment[];
  aiConfidence: number;
  localContextMatches: LocalContextMatch[];
  createdAt?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}
