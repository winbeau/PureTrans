import { apiClient, unwrapApiResponse } from './client';

import type {
  ApiResponse,
  CheckRequest,
  CheckResult,
  CompareTranslationResult,
  HealthResponse,
  TranslationRequest,
  TranslationResult,
} from '../types/api';

export async function healthCheck(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
}

export async function translateWithKb(payload: TranslationRequest): Promise<TranslationResult> {
  const response = await apiClient.post<ApiResponse<TranslationResult>>('/api/v1/translate/kb', payload);
  return unwrapApiResponse(response.data);
}

export async function translateDirect(payload: TranslationRequest): Promise<TranslationResult> {
  const response = await apiClient.post<ApiResponse<TranslationResult>>('/api/v1/translate/direct', payload);
  return unwrapApiResponse(response.data);
}

export async function compareTranslate(payload: TranslationRequest): Promise<CompareTranslationResult> {
  const response = await apiClient.post<ApiResponse<CompareTranslationResult>>('/api/v1/translate/compare', payload);
  return unwrapApiResponse(response.data);
}

export async function checkTranslation(payload: CheckRequest): Promise<CheckResult> {
  const response = await apiClient.post<ApiResponse<CheckResult>>('/api/v1/check', payload);
  return unwrapApiResponse(response.data);
}
