import axios from 'axios';

import type { ApiResponse } from '../types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 120000,
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const backendMessage = error.response?.data?.error?.message;
    if (backendMessage) {
      return backendMessage;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '请求失败，请稍后重试';
}

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(response.error?.message || '请求失败，请稍后重试');
  }

  return response.data;
}
