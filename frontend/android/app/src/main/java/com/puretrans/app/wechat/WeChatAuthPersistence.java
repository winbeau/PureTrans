package com.puretrans.app.wechat;

import androidx.annotation.Nullable;

public class WeChatAuthPersistence {
    private static final String KEY_PENDING_APP_ID = "pending_app_id";
    private static final String KEY_RESULT_STATUS = "result_status";
    private static final String KEY_RESULT_CODE = "result_code";
    private static final String KEY_RESULT_STATE = "result_state";
    private static final String RESULT_STATUS_SUCCESS = "success";
    private static final String RESULT_STATUS_ERROR = "error";

    private final WeChatAuthStore store;

    public WeChatAuthPersistence(WeChatAuthStore store) {
        this.store = store;
    }

    public void savePendingRequest(String appId) {
        store.putString(KEY_PENDING_APP_ID, appId);
        clearPendingResult();
    }

    @Nullable
    public String getPendingAppId() {
        return store.getString(KEY_PENDING_APP_ID);
    }

    public boolean hasPendingRequest() {
        return getPendingAppId() != null;
    }

    public void clearPendingRequest() {
        store.remove(KEY_PENDING_APP_ID);
    }

    public void clearAll() {
        clearPendingRequest();
        clearPendingResult();
    }

    public void saveSuccessResult(String code, String state) {
        clearPendingRequest();
        store.putString(KEY_RESULT_STATUS, RESULT_STATUS_SUCCESS);
        store.putString(KEY_RESULT_CODE, code);
        store.putString(KEY_RESULT_STATE, state);
    }

    public void saveErrorResult(String errorCode) {
        clearPendingRequest();
        store.putString(KEY_RESULT_STATUS, RESULT_STATUS_ERROR);
        store.putString(KEY_RESULT_CODE, errorCode);
        store.remove(KEY_RESULT_STATE);
    }

    public PendingResult consumePendingResult() {
        String status = store.getString(KEY_RESULT_STATUS);
        if (status == null) {
            return PendingResult.idle();
        }

        String code = store.getString(KEY_RESULT_CODE);
        String state = store.getString(KEY_RESULT_STATE);
        clearPendingResult();

        if (RESULT_STATUS_SUCCESS.equals(status) && code != null && state != null) {
            return PendingResult.success(code, state);
        }

        if (RESULT_STATUS_ERROR.equals(status) && code != null) {
            return PendingResult.error(code);
        }

        return PendingResult.idle();
    }

    private void clearPendingResult() {
        store.remove(KEY_RESULT_STATUS);
        store.remove(KEY_RESULT_CODE);
        store.remove(KEY_RESULT_STATE);
    }

    public static final class PendingResult {
        private final String status;
        private final String code;
        private final String state;

        private PendingResult(String status, @Nullable String code, @Nullable String state) {
            this.status = status;
            this.code = code;
            this.state = state;
        }

        public static PendingResult idle() {
            return new PendingResult("idle", null, null);
        }

        public static PendingResult success(String code, String state) {
            return new PendingResult("success", code, state);
        }

        public static PendingResult error(String errorCode) {
            return new PendingResult("error", errorCode, null);
        }

        public String getStatus() {
            return status;
        }

        @Nullable
        public String getCode() {
            return code;
        }

        @Nullable
        public String getState() {
            return state;
        }
    }

    public interface WeChatAuthStore {
        @Nullable
        String getString(String key);

        void putString(String key, String value);

        void remove(String key);
    }
}
