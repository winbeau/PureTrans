package com.puretrans.app.wechat;

public class WeChatAuthCoordinator {
    private PendingRequest pendingRequest;

    public synchronized String beginAuthorization(
        WeChatAuthApi api,
        String appId,
        String scope,
        String state
    ) {
        return beginAuthorization(api, appId, scope, state, null);
    }

    public synchronized String beginAuthorization(
        WeChatAuthApi api,
        String appId,
        String scope,
        String state,
        String callbackId
    ) {
        if (pendingRequest != null) {
            return "wechat_concurrent_request";
        }
        if (!api.isWeChatInstalled()) {
            return "wechat_not_installed";
        }
        if (!api.registerApp(appId)) {
            return "wechat_register_failed";
        }
        if (!api.sendAuthorization(scope, state)) {
            return "wechat_send_failed";
        }

        pendingRequest = new PendingRequest(appId, callbackId);
        return null;
    }

    public synchronized PendingRequest getPendingRequest() {
        return pendingRequest;
    }

    public synchronized PendingRequest consumePendingRequest() {
        PendingRequest current = pendingRequest;
        pendingRequest = null;
        return current;
    }

    public synchronized void clearPendingRequest() {
        pendingRequest = null;
    }

    public synchronized boolean hasPendingRequest() {
        return pendingRequest != null;
    }

    public static String mapResponseError(int errorCode) {
        if (errorCode == -2) {
            return "wechat_cancelled";
        }
        if (errorCode == -4) {
            return "wechat_denied";
        }
        return "wechat_unknown";
    }

    public static final class PendingRequest {
        private final String appId;
        private final String callbackId;

        private PendingRequest(String appId, String callbackId) {
            this.appId = appId;
            this.callbackId = callbackId;
        }

        public String getAppId() {
            return appId;
        }

        public String getCallbackId() {
            return callbackId;
        }
    }
}
