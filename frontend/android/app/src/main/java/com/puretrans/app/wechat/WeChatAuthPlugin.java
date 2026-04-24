package com.puretrans.app.wechat;

import android.content.Context;

import androidx.annotation.Nullable;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WeChatAuth")
public class WeChatAuthPlugin extends Plugin {
    private static final WeChatAuthCoordinator COORDINATOR = new WeChatAuthCoordinator();
    private static volatile WeChatAuthPlugin activeInstance;

    @Override
    public void load() {
        super.load();
        activeInstance = this;
    }

    @PluginMethod
    public void authorize(PluginCall call) {
        String appId = call.getString("appId");
        String scope = call.getString("scope");
        String state = call.getString("state");

        if (appId == null || scope == null || state == null) {
            call.reject("Missing WeChat authorization parameters.", "wechat_unknown");
            return;
        }

        Bridge bridge = getBridge();
        bridge.saveCall(call);

        WeChatAuthPersistence persistence = getPersistence();
        if (persistence.hasPendingRequest()) {
            bridge.releaseCall(call);
            reject(call, "wechat_concurrent_request");
            return;
        }

        String errorCode = COORDINATOR.beginAuthorization(
            new TencentWeChatAuthApi(getContext(), appId),
            appId,
            scope,
            state,
            call.getCallbackId()
        );

        if (errorCode != null) {
            bridge.releaseCall(call);
            reject(call, errorCode);
            return;
        }

        persistence.savePendingRequest(appId);
    }

    @PluginMethod
    public void consumePendingResult(PluginCall call) {
        WeChatAuthPersistence.PendingResult pendingResult = getPersistence().consumePendingResult();
        JSObject result = new JSObject();
        result.put("status", pendingResult.getStatus());
        if (pendingResult.getCode() != null) {
            if ("success".equals(pendingResult.getStatus())) {
                result.put("code", pendingResult.getCode());
            } else {
                result.put("errorCode", pendingResult.getCode());
            }
        }
        if (pendingResult.getState() != null) {
            result.put("state", pendingResult.getState());
        }
        call.resolve(result);
    }

    @PluginMethod
    public void resetPendingRequest(PluginCall call) {
        COORDINATOR.clearPendingRequest();
        getPersistence().clearAll();
        call.resolve();
    }

    @Nullable
    public static String getPendingAppId(Context context) {
        return new WeChatAuthPersistence(new SharedPreferencesWeChatAuthStore(context)).getPendingAppId();
    }

    public static void handleAuthResponse(Context context, int errCode, @Nullable String code, @Nullable String state) {
        WeChatAuthCoordinator.PendingRequest pendingRequest = COORDINATOR.consumePendingRequest();
        WeChatAuthPersistence persistence = new WeChatAuthPersistence(new SharedPreferencesWeChatAuthStore(context));
        WeChatAuthPlugin plugin = activeInstance;
        PluginCall call = null;

        if (pendingRequest != null && plugin != null && pendingRequest.getCallbackId() != null) {
            call = plugin.getBridge().getSavedCall(pendingRequest.getCallbackId());
        }

        if (errCode == 0 && code != null && state != null) {
            if (call != null) {
                JSObject result = new JSObject();
                result.put("code", code);
                result.put("state", state);
                call.resolve(result);
                plugin.getBridge().releaseCall(call);
                persistence.clearAll();
                return;
            }

            persistence.saveSuccessResult(code, state);
            return;
        }

        String errorCode = WeChatAuthCoordinator.mapResponseError(errCode);
        if (call != null) {
            reject(call, errorCode);
            plugin.getBridge().releaseCall(call);
            persistence.clearAll();
            return;
        }

        persistence.saveErrorResult(errorCode);
    }

    private static void reject(PluginCall call, String errorCode) {
        call.reject(messageFor(errorCode), errorCode);
    }

    private static String messageFor(String errorCode) {
        switch (errorCode) {
            case "wechat_not_installed":
                return "WeChat is not installed on this device.";
            case "wechat_register_failed":
                return "WeChat SDK registration failed.";
            case "wechat_send_failed":
                return "WeChat authorization request failed to start.";
            case "wechat_cancelled":
                return "WeChat authorization was cancelled.";
            case "wechat_denied":
                return "WeChat authorization was denied.";
            case "wechat_concurrent_request":
                return "A WeChat authorization request is already in progress.";
            default:
                return "WeChat authorization failed with an unknown error.";
        }
    }

    private WeChatAuthPersistence getPersistence() {
        return new WeChatAuthPersistence(new SharedPreferencesWeChatAuthStore(getContext()));
    }
}
