package com.puretrans.app.wechat;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WeChatAuthCoordinatorTest {

    @Test
    public void mapsWeChatResponseErrorsToStableCodes() {
        assertEquals("wechat_cancelled", WeChatAuthCoordinator.mapResponseError(-2));
        assertEquals("wechat_denied", WeChatAuthCoordinator.mapResponseError(-4));
        assertEquals("wechat_unknown", WeChatAuthCoordinator.mapResponseError(-1));
    }

    @Test
    public void rejectsConcurrentAuthorizationRequests() {
        WeChatAuthCoordinator coordinator = new WeChatAuthCoordinator();
        FakeWeChatApi successApi = new FakeWeChatApi(true, true, true);

        String firstAttempt = coordinator.beginAuthorization(successApi, "wx-app", "snsapi_userinfo", "state-1");
        String secondAttempt = coordinator.beginAuthorization(successApi, "wx-app", "snsapi_userinfo", "state-2");

        assertEquals(null, firstAttempt);
        assertEquals("wechat_concurrent_request", secondAttempt);
        assertTrue(coordinator.hasPendingRequest());
    }

    @Test
    public void failsImmediatelyWhenWeChatIsNotInstalled() {
        WeChatAuthCoordinator coordinator = new WeChatAuthCoordinator();
        FakeWeChatApi api = new FakeWeChatApi(false, true, true);

        String errorCode = coordinator.beginAuthorization(api, "wx-app", "snsapi_userinfo", "state-1");

        assertEquals("wechat_not_installed", errorCode);
        assertFalse(coordinator.hasPendingRequest());
    }

    private static final class FakeWeChatApi implements WeChatAuthApi {
        private final boolean installed;
        private final boolean registered;
        private final boolean sent;

        private FakeWeChatApi(boolean installed, boolean registered, boolean sent) {
            this.installed = installed;
            this.registered = registered;
            this.sent = sent;
        }

        @Override
        public boolean isWeChatInstalled() {
            return installed;
        }

        @Override
        public boolean registerApp(String appId) {
            return registered;
        }

        @Override
        public boolean sendAuthorization(String scope, String state) {
            return sent;
        }
    }
}
