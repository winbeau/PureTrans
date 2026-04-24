package com.puretrans.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.puretrans.app.wechat.WeChatAuthPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WeChatAuthPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
