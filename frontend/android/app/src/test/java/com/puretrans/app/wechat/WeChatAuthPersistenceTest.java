package com.puretrans.app.wechat;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import java.util.HashMap;
import java.util.Map;

import org.junit.Test;

public class WeChatAuthPersistenceTest {

    @Test
    public void consumesPersistedSuccessResultAfterColdStart() {
        FakeStore store = new FakeStore();
        WeChatAuthPersistence firstProcess = new WeChatAuthPersistence(store);
        firstProcess.savePendingRequest("wx-app");
        firstProcess.saveSuccessResult("wechat-code", "signed-state");

        WeChatAuthPersistence secondProcess = new WeChatAuthPersistence(store);
        WeChatAuthPersistence.PendingResult result = secondProcess.consumePendingResult();

        assertEquals("success", result.getStatus());
        assertEquals("wechat-code", result.getCode());
        assertEquals("signed-state", result.getState());
        assertNull(secondProcess.getPendingAppId());
    }

    @Test
    public void consumesPersistedErrorResultAfterColdStart() {
        FakeStore store = new FakeStore();
        WeChatAuthPersistence firstProcess = new WeChatAuthPersistence(store);
        firstProcess.savePendingRequest("wx-app");
        firstProcess.saveErrorResult("wechat_cancelled");

        WeChatAuthPersistence secondProcess = new WeChatAuthPersistence(store);
        WeChatAuthPersistence.PendingResult result = secondProcess.consumePendingResult();

        assertEquals("error", result.getStatus());
        assertEquals("wechat_cancelled", result.getCode());
        assertNull(result.getState());
    }

    private static final class FakeStore implements WeChatAuthPersistence.WeChatAuthStore {
        private final Map<String, String> values = new HashMap<>();

        @Override
        public String getString(String key) {
            return values.get(key);
        }

        @Override
        public void putString(String key, String value) {
            values.put(key, value);
        }

        @Override
        public void remove(String key) {
            values.remove(key);
        }
    }
}
