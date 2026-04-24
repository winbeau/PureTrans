export type Direction = '中英' | '英中' | '俄中' | '中俄' | '维中' | '中维' | '维俄' | '俄维';

export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
};

export type HealthResponse = {
  requestId?: string;
  status: string;
  wechatConfigured?: boolean;
};

export type TranslationRequest = {
  direction: Direction;
  source_text: string;
  user_id?: string;
};

export type RagCitation = {
  source_id: string;
  title?: string | null;
  snippet: string;
  relevance_score?: number | null;
  knowledge_domain?: string | null;
  retrieved_at?: string | null;
};

export type TranslationMode = 'kb' | 'direct';

export type TranslationResult = {
  direction: Direction;
  source_text: string;
  translated_text: string;
  mode: TranslationMode;
  citations: RagCitation[];
};

export type CompareTranslationResult = {
  direction: Direction;
  source_text: string;
  kb_translation?: TranslationResult;
  direct_translation?: TranslationResult;
  kb_translated_text?: string;
  direct_translated_text?: string;
};

export type CheckRequest = {
  direction: Direction;
  source_text: string;
  target_text: string;
  user_id?: string;
};

export type CheckIssue = {
  type: string;
  severity?: string | null;
  message?: string;
  suggestion?: string | null;
  reason?: string | null;
  original_text?: string | null;
  suggested_text?: string | null;
  start_index?: number | null;
  end_index?: number | null;
};

export type CheckResult = {
  direction: Direction;
  source_text: string;
  target_text: string;
  issues: CheckIssue[];
  revised_text?: string | null;
  revisedText?: string | null;
  has_errors?: boolean;
  overall_score?: number | null;
};
