package com.puretrans.app.wxapi;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.puretrans.app.wechat.WeChatAuthPlugin;
import com.tencent.mm.opensdk.constants.ConstantsAPI;
import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

public class WXEntryActivity extends Activity implements IWXAPIEventHandler {
    private IWXAPI api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    public void onReq(BaseReq baseReq) {
        finish();
    }

    @Override
    public void onResp(BaseResp baseResp) {
        if (baseResp.getType() != ConstantsAPI.COMMAND_SENDAUTH) {
            finish();
            return;
        }

        if (baseResp.errCode == BaseResp.ErrCode.ERR_OK && baseResp instanceof SendAuth.Resp) {
            SendAuth.Resp authResp = (SendAuth.Resp) baseResp;
            WeChatAuthPlugin.handleAuthResponse(this, baseResp.errCode, authResp.code, authResp.state);
        } else {
            WeChatAuthPlugin.handleAuthResponse(this, baseResp.errCode, null, null);
        }

        finish();
    }

    private void handleIntent(Intent intent) {
        String appId = WeChatAuthPlugin.getPendingAppId(this);
        if (appId == null) {
            finish();
            return;
        }

        api = WXAPIFactory.createWXAPI(this, appId, false);
        api.handleIntent(intent, this);
    }
}
