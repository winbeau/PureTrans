import { Capacitor } from '@capacitor/core';

import type {
  AuthHealthResponse,
  WeChatChallengeResponse,
  WeChatExchangeRequest,
  WeChatExchangeResponse,
} from './types';

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (Capacitor.getPlatform() !== 'web') {
    throw {
      code: 'backend_not_configured',
      message: '移动端未配置后端地址，请设置 VITE_API_BASE_URL 后重新构建应用。',
    };
  }

  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    return window.location.origin;
  }

  return 'http://127.0.0.1:8000';
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    const endpoint = `${getApiBaseUrl()}${path}`;
    response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
      throw error;
    }
    throw {
      code: 'network_unavailable',
      message: '无法连接到清译服务，请检查当前网络或后端地址配置。',
    };
  }

  const text = await response.text();
  let payload: ApiErrorPayload | T | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as ApiErrorPayload | T;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw {
      code: errorPayload?.error?.code ?? 'unknown_error',
      message: errorPayload?.error?.message ?? '认证请求失败，请稍后重试。',
    };
  }

  return payload as T;
}

export const authApi = {
  getHealth(): Promise<AuthHealthResponse> {
    return requestJson<AuthHealthResponse>('/api/health');
  },
  getSession(token: string): Promise<WeChatExchangeResponse> {
    return requestJson<WeChatExchangeResponse>('/api/auth/session', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  createChallenge(): Promise<WeChatChallengeResponse> {
    return requestJson<WeChatChallengeResponse>('/api/auth/wechat/challenge', {
      method: 'POST',
    });
  },
  exchangeCode(payload: WeChatExchangeRequest): Promise<WeChatExchangeResponse> {
    return requestJson<WeChatExchangeResponse>('/api/auth/wechat/exchange', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
