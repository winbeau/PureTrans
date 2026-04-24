import { registerPlugin } from '@capacitor/core';

import type { AuthErrorCode } from '../types';


export type WeChatAuthorizeOptions = {
  appId: string;
  scope: string;
  state: string;
};

export type WeChatAuthorizeResult = {
  code: string;
  state: string;
};

export type PendingWeChatAuthorizeResult =
  | { status: 'idle' }
  | { status: 'success'; code: string; state: string }
  | { status: 'error'; errorCode: AuthErrorCode };

export type WeChatAuthPlugin = {
  authorize(options: WeChatAuthorizeOptions): Promise<WeChatAuthorizeResult>;
  consumePendingResult(): Promise<PendingWeChatAuthorizeResult>;
  resetPendingRequest(): Promise<void>;
};

export const WeChatAuth = registerPlugin<WeChatAuthPlugin>('WeChatAuth');
