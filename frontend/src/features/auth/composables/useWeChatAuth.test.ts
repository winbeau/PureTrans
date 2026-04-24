import { watch } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AuthenticatedSession,
  AuthenticatedUser,
  WeChatChallengeResponse,
  WeChatExchangeResponse,
} from '../types';
import {
  PENDING_AUTH_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  createWeChatAuthController,
  type AuthControllerDependencies,
} from './useWeChatAuth';

type StoredSession = {
  session: AuthenticatedSession;
  user: AuthenticatedUser;
};

const baseChallenge: WeChatChallengeResponse = {
  requestId: 'request-1',
  challengeId: 'challenge-1',
  wechatAppId: 'wx-test-app',
  scope: 'snsapi_userinfo',
  state: 'signed-state',
  expiresAt: '2030-01-01T00:10:00Z',
};

const baseExchange: WeChatExchangeResponse = {
  requestId: 'request-2',
  session: {
    token: 'puretrans-session',
    expiresAt: '2030-01-01T02:00:00Z',
  },
  user: {
    openId: 'openid-1',
    unionId: 'unionid-1',
    nickname: '清译用户',
    avatarUrl: 'https://example.com/avatar.png',
    province: 'Xinjiang',
    city: 'Urumqi',
    country: 'CN',
  },
};

function createDependencies(overrides: Partial<AuthControllerDependencies> = {}): AuthControllerDependencies {
  const storage = new Map<string, string>();

  return {
    api: {
      getHealth: vi.fn().mockResolvedValue({
        requestId: 'health-1',
        status: 'ok',
        wechatConfigured: true,
      }),
      getSession: vi.fn().mockResolvedValue(baseExchange),
      createChallenge: vi.fn().mockResolvedValue(baseChallenge),
      exchangeCode: vi.fn().mockResolvedValue(baseExchange),
    },
    nativeAuth: {
      authorize: vi.fn().mockResolvedValue({
        code: 'wechat-code',
        state: 'signed-state',
      }),
      consumePendingResult: vi.fn().mockResolvedValue({ status: 'idle' }),
      resetPendingRequest: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      get: vi.fn(async (key: string) => storage.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        storage.set(key, value);
      }),
      remove: vi.fn(async (key: string) => {
        storage.delete(key);
      }),
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('createWeChatAuthController', () => {
  it('flows from anonymous to starting to exchanging to authenticated', async () => {
    const dependencies = createDependencies();
    const controller = createWeChatAuthController(dependencies);
    const statuses: string[] = [];

    const stop = watch(
      () => controller.state.value.status,
      (status) => {
        statuses.push(status);
      },
      { immediate: true },
    );

    await controller.initialize();
    await controller.login();
    stop();

    expect(statuses).toEqual(['anonymous', 'starting', 'exchanging', 'authenticated']);
    expect(dependencies.nativeAuth.resetPendingRequest).toHaveBeenCalledTimes(1);
    expect(controller.state.value.status).toBe('authenticated');
    expect(controller.sessionBundle.value).toEqual({
      session: baseExchange.session,
      user: baseExchange.user,
    });
  });

  it('maps native plugin errors to UI-safe auth errors', async () => {
    const controller = createWeChatAuthController(
      createDependencies({
        nativeAuth: {
          authorize: vi.fn().mockRejectedValue({
            code: 'wechat_not_installed',
          }),
          consumePendingResult: vi.fn().mockResolvedValue({ status: 'idle' }),
          resetPendingRequest: vi.fn().mockResolvedValue(undefined),
        },
      }),
    );

    await controller.initialize();
    await controller.login();

    expect(controller.state.value.status).toBe('error');
    if (controller.state.value.status !== 'error') {
      throw new Error('expected error state');
    }

    expect(controller.state.value.error.code).toBe('wechat_not_installed');
    expect(controller.state.value.error.message).toContain('微信');
  });

  it('restores a persisted session through backend validation and clears it on logout', async () => {
    const storedSession: StoredSession = {
      session: baseExchange.session,
      user: baseExchange.user,
    };
    const dependencies = createDependencies({
      storage: {
        get: vi.fn(async (key: string) => {
          if (key === SESSION_STORAGE_KEY) {
            return JSON.stringify(storedSession);
          }
          return null;
        }),
        set: vi.fn(),
        remove: vi.fn(),
      },
    });
    const controller = createWeChatAuthController(dependencies);

    await controller.initialize();

    expect(dependencies.storage.get).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
    expect(dependencies.api.getSession).toHaveBeenCalledWith(baseExchange.session.token);
    expect(controller.state.value.status).toBe('authenticated');

    await controller.logout();

    expect(dependencies.storage.remove).toHaveBeenCalledWith(SESSION_STORAGE_KEY);
    expect(dependencies.storage.remove).toHaveBeenCalledWith(PENDING_AUTH_STORAGE_KEY);
    expect(controller.state.value.status).toBe('anonymous');
  });

  it('keeps a persisted session when validation fails for a transient reason', async () => {
    const storedSession: StoredSession = {
      session: baseExchange.session,
      user: baseExchange.user,
    };
    const dependencies = createDependencies({
      api: {
        getHealth: vi.fn().mockResolvedValue({
          requestId: 'health-1',
          status: 'ok',
          wechatConfigured: true,
        }),
        getSession: vi.fn().mockRejectedValue({
          code: 'network_unavailable',
          message: 'temporary outage',
        }),
        createChallenge: vi.fn().mockResolvedValue(baseChallenge),
        exchangeCode: vi.fn().mockResolvedValue(baseExchange),
      },
      storage: {
        get: vi.fn(async (key: string) => {
          if (key === SESSION_STORAGE_KEY) {
            return JSON.stringify(storedSession);
          }
          return null;
        }),
        set: vi.fn(),
        remove: vi.fn(),
      },
    });
    const controller = createWeChatAuthController(dependencies);

    await controller.initialize();

    expect(controller.state.value.status).toBe('error');
    expect(dependencies.storage.remove).not.toHaveBeenCalledWith(SESSION_STORAGE_KEY);
  });

  it('resumes a pending native login result after app restart', async () => {
    const dependencies = createDependencies({
      storage: {
        get: vi.fn(async (key: string) => {
          if (key === SESSION_STORAGE_KEY) {
            return null;
          }
          if (key === PENDING_AUTH_STORAGE_KEY) {
            return JSON.stringify({
              challengeId: baseChallenge.challengeId,
              state: baseChallenge.state,
            });
          }
          return null;
        }),
        set: vi.fn(),
        remove: vi.fn(),
      },
      nativeAuth: {
        authorize: vi.fn(),
        consumePendingResult: vi.fn().mockResolvedValue({
          status: 'success',
          code: 'wechat-code',
          state: 'signed-state',
        }),
        resetPendingRequest: vi.fn().mockResolvedValue(undefined),
      },
    });
    const controller = createWeChatAuthController(dependencies);

    await controller.initialize();

    expect(dependencies.nativeAuth.consumePendingResult).toHaveBeenCalledTimes(1);
    expect(dependencies.api.exchangeCode).toHaveBeenCalledWith({
      challengeId: baseChallenge.challengeId,
      code: 'wechat-code',
      state: 'signed-state',
    });
    expect(controller.state.value.status).toBe('authenticated');
  });
});
