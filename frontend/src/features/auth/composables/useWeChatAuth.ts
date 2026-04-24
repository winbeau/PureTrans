import { computed, ref } from 'vue';

import { authApi } from '../api';
import { sessionStorage } from '../storage';
import { WeChatAuth } from '../native/wechatAuth';
import type {
  AuthenticatedBundle,
  AuthError,
  AuthErrorCode,
  AuthHealthResponse,
  AuthState,
  PendingWeChatAuthResult,
  PendingWeChatChallenge,
  WeChatChallengeResponse,
  WeChatExchangeResponse,
} from '../types';


export const SESSION_STORAGE_KEY = 'puretrans.auth.session.v1';
export const PENDING_AUTH_STORAGE_KEY = 'puretrans.auth.pending.v1';

type NativeAuthorizePayload = {
  code: string;
  state: string;
};

type AuthApiClient = {
  getHealth(): Promise<AuthHealthResponse>;
  getSession(token: string): Promise<WeChatExchangeResponse>;
  createChallenge(): Promise<WeChatChallengeResponse>;
  exchangeCode(payload: {
    challengeId: string;
    code: string;
    state: string;
  }): Promise<WeChatExchangeResponse>;
};

type NativeWeChatAuth = {
  authorize(options: {
    appId: string;
    scope: string;
    state: string;
  }): Promise<NativeAuthorizePayload>;
  consumePendingResult(): Promise<PendingWeChatAuthResult>;
  resetPendingRequest(): Promise<void>;
};

type SessionStorageAdapter = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export type AuthControllerDependencies = {
  api: AuthApiClient;
  nativeAuth: NativeWeChatAuth;
  storage: SessionStorageAdapter;
};

function isBundleExpired(bundle: AuthenticatedBundle): boolean {
  return Number.isNaN(Date.parse(bundle.session.expiresAt)) || Date.parse(bundle.session.expiresAt) <= Date.now();
}

function createError(code: AuthErrorCode, fallbackMessage: string): AuthError {
  const messages: Record<AuthErrorCode, string> = {
    auth_not_configured: '当前服务端还未完成微信登录配置，请先补齐微信应用 ID 和服务端密钥。',
    auth_state_invalid: '本次微信授权已失效，请重新发起登录。',
    backend_not_configured: '移动端未配置后端地址，请设置 VITE_API_BASE_URL 后重新构建应用。',
    wechat_not_installed: '未检测到微信客户端，无法继续授权登录。',
    wechat_exchange_failed: '微信授权码换取会话失败，请稍后重试。',
    wechat_userinfo_failed: '微信账号信息获取失败，请稍后重试。',
    wechat_register_failed: '微信登录组件注册失败，请检查当前 Android 构建配置。',
    wechat_send_failed: '微信授权请求发送失败，请稍后重试。',
    wechat_cancelled: '你已取消本次微信授权。',
    wechat_denied: '微信已拒绝本次授权，请确认授权范围后重试。',
    wechat_concurrent_request: '已有微信授权流程进行中，请先完成当前请求。',
    wechat_unknown: '微信登录返回了未识别状态，请重试一次。',
    network_unavailable: '无法连接到清译服务，请检查网络或后端地址配置。',
    session_invalid: '本地登录态已失效，请重新登录。',
    unknown_error: fallbackMessage,
  };

  return {
    code,
    message: messages[code] ?? fallbackMessage,
  };
}

function normalizeError(error: unknown, fallbackMessage: string): AuthError {
  if (typeof error === 'object' && error !== null) {
    const maybeCode = 'code' in error && typeof error.code === 'string' ? (error.code as AuthErrorCode) : 'unknown_error';
    const maybeMessage =
      'message' in error && typeof error.message === 'string' ? error.message : fallbackMessage;

    return createError(maybeCode, maybeMessage);
  }

  return createError('unknown_error', fallbackMessage);
}

function readSessionBundle(serialized: string | null): AuthenticatedBundle | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as AuthenticatedBundle;
    if (!parsed?.session?.token || !parsed?.session?.expiresAt || !parsed?.user?.openId || !parsed?.user?.nickname) {
      return null;
    }
    if (isBundleExpired(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readPendingChallenge(serialized: string | null): PendingWeChatChallenge | null {
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as PendingWeChatChallenge;
    if (!parsed?.challengeId || !parsed?.state) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createWeChatAuthController(
  dependencies: AuthControllerDependencies = {
    api: authApi,
    nativeAuth: WeChatAuth,
    storage: sessionStorage,
  },
) {
  const state = ref<AuthState>({ status: 'anonymous' });
  const health = ref<AuthHealthResponse | null>(null);
  const isReady = ref(false);

  const sessionBundle = computed<AuthenticatedBundle | null>(() => {
    if (state.value.status !== 'authenticated') {
      return null;
    }

    return {
      session: state.value.session,
      user: state.value.user,
    };
  });

  async function persistAuthenticatedBundle(bundle: AuthenticatedBundle): Promise<void> {
    await dependencies.storage.set(SESSION_STORAGE_KEY, JSON.stringify(bundle));
    state.value = {
      status: 'authenticated',
      ...bundle,
    };
  }

  async function clearStoredSession(): Promise<void> {
    await dependencies.storage.remove(SESSION_STORAGE_KEY);
  }

  async function clearPendingAuth(): Promise<void> {
    await dependencies.storage.remove(PENDING_AUTH_STORAGE_KEY);
  }

  async function exchangePendingAuthorization(
    pendingChallenge: PendingWeChatChallenge,
    authorization: NativeAuthorizePayload,
  ): Promise<void> {
    if (authorization.state !== pendingChallenge.state) {
      await clearPendingAuth();
      throw { code: 'auth_state_invalid' };
    }

    state.value = { status: 'exchanging' };
    const result = await dependencies.api.exchangeCode({
      challengeId: pendingChallenge.challengeId,
      code: authorization.code,
      state: authorization.state,
    });

    await clearPendingAuth();
    await persistAuthenticatedBundle({
      session: result.session,
      user: result.user,
    });
  }

  async function restorePersistedSession(bundle: AuthenticatedBundle): Promise<'authenticated' | 'invalid'> {
    try {
      const result = await dependencies.api.getSession(bundle.session.token);
      await persistAuthenticatedBundle({
        session: result.session,
        user: result.user,
      });
      return 'authenticated';
    } catch (error) {
      const normalizedError = normalizeError(error, '无法恢复登录状态，请稍后重试。');
      if (normalizedError.code === 'session_invalid') {
        await clearStoredSession();
        return 'invalid';
      }
      throw normalizedError;
    }
  }

  async function resumePendingLogin(pendingChallenge: PendingWeChatChallenge): Promise<boolean> {
    const pendingResult = await dependencies.nativeAuth.consumePendingResult();
    if (pendingResult.status === 'idle') {
      return false;
    }

    if (pendingResult.status === 'error') {
      await clearPendingAuth();
      state.value = {
        status: 'error',
        error: createError(pendingResult.errorCode, '微信登录失败，请稍后重试。'),
      };
      return true;
    }

    await exchangePendingAuthorization(pendingChallenge, pendingResult);
    return true;
  }

  async function initialize(): Promise<void> {
    const [healthResult, stored, pending] = await Promise.allSettled([
      dependencies.api.getHealth(),
      dependencies.storage.get(SESSION_STORAGE_KEY),
      dependencies.storage.get(PENDING_AUTH_STORAGE_KEY),
    ]);

    if (healthResult.status === 'fulfilled') {
      health.value = healthResult.value;
    }

    if (stored.status === 'fulfilled' && stored.value) {
      const restoredBundle = readSessionBundle(stored.value);
      if (restoredBundle) {
        try {
          if ((await restorePersistedSession(restoredBundle)) === 'authenticated') {
            isReady.value = true;
            return;
          }
        } catch (error) {
          state.value = {
            status: 'error',
            error: normalizeError(error, '无法恢复登录状态，请稍后重试。'),
          };
          isReady.value = true;
          return;
        }
      }
    }

    if (pending.status === 'fulfilled' && pending.value) {
      const pendingChallenge = readPendingChallenge(pending.value);
      if (pendingChallenge) {
        try {
          if (await resumePendingLogin(pendingChallenge)) {
            isReady.value = true;
            return;
          }
        } catch (error) {
          await clearPendingAuth();
          state.value = {
            status: 'error',
            error: normalizeError(error, '微信登录失败，请稍后重试。'),
          };
          isReady.value = true;
          return;
        }
      } else {
        await clearPendingAuth();
      }
    }

    state.value =
      healthResult.status === 'fulfilled'
        ? { status: 'anonymous' }
        : {
            status: 'error',
            error: createError('network_unavailable', '无法连接到清译服务。'),
          };
    isReady.value = true;
  }

  async function login(): Promise<void> {
    state.value = { status: 'starting' };

    try {
      await clearPendingAuth();
      await dependencies.nativeAuth.resetPendingRequest();
      const challenge = await dependencies.api.createChallenge();
      const pendingChallenge: PendingWeChatChallenge = {
        challengeId: challenge.challengeId,
        state: challenge.state,
      };
      await dependencies.storage.set(PENDING_AUTH_STORAGE_KEY, JSON.stringify(pendingChallenge));

      const authorization = await dependencies.nativeAuth.authorize({
        appId: challenge.wechatAppId,
        scope: challenge.scope,
        state: challenge.state,
      });

      await exchangePendingAuthorization(pendingChallenge, authorization);
    } catch (error) {
      await clearPendingAuth();
      state.value = {
        status: 'error',
        error: normalizeError(error, '微信登录失败，请稍后重试。'),
      };
    }
  }

  async function logout(): Promise<void> {
    await clearStoredSession();
    await clearPendingAuth();
    state.value = { status: 'anonymous' };
  }

  return {
    state,
    health,
    isReady,
    sessionBundle,
    initialize,
    login,
    logout,
  };
}
