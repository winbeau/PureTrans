export type WeChatChallengeResponse = {
  requestId: string;
  challengeId: string;
  wechatAppId: string;
  scope: string;
  state: string;
  expiresAt: string;
};

export type WeChatExchangeRequest = {
  challengeId: string;
  code: string;
  state: string;
};

export type AuthenticatedSession = {
  token: string;
  expiresAt: string;
};

export type AuthenticatedUser = {
  openId: string;
  unionId?: string | null;
  nickname: string;
  avatarUrl?: string | null;
  province?: string | null;
  city?: string | null;
  country?: string | null;
};

export type WeChatExchangeResponse = {
  requestId: string;
  session: AuthenticatedSession;
  user: AuthenticatedUser;
};

export type AuthenticatedBundle = {
  session: AuthenticatedSession;
  user: AuthenticatedUser;
};

export type AuthHealthResponse = {
  requestId: string;
  status: 'ok';
  wechatConfigured: boolean;
};

export type AuthErrorCode =
  | 'auth_not_configured'
  | 'auth_state_invalid'
  | 'backend_not_configured'
  | 'wechat_not_installed'
  | 'wechat_exchange_failed'
  | 'wechat_userinfo_failed'
  | 'wechat_register_failed'
  | 'wechat_send_failed'
  | 'wechat_cancelled'
  | 'wechat_denied'
  | 'wechat_concurrent_request'
  | 'wechat_unknown'
  | 'network_unavailable'
  | 'session_invalid'
  | 'unknown_error';

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthState =
  | { status: 'anonymous' }
  | { status: 'starting' }
  | { status: 'exchanging' }
  | ({ status: 'authenticated' } & AuthenticatedBundle)
  | { status: 'error'; error: AuthError };

export type PendingWeChatChallenge = {
  challengeId: string;
  state: string;
};

export type PendingWeChatAuthResult =
  | { status: 'idle' }
  | { status: 'success'; code: string; state: string }
  | { status: 'error'; errorCode: AuthErrorCode };
