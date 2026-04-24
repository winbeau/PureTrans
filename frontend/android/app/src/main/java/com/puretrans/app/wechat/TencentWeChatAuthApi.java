package com.puretrans.app.wechat;

import android.content.Context;

import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

public final class TencentWeChatAuthApi implements WeChatAuthApi {
    private final IWXAPI api;

    public TencentWeChatAuthApi(Context context, String appId) {
        this.api = WXAPIFactory.createWXAPI(context, appId, true);
    }

    @Override
    public boolean isWeChatInstalled() {
        return api.isWXAppInstalled();
    }

    @Override
    public boolean registerApp(String appId) {
        return api.registerApp(appId);
    }

    @Override
    public boolean sendAuthorization(String scope, String state) {
        SendAuth.Req request = new SendAuth.Req();
        request.scope = scope;
        request.state = state;
        return api.sendReq(request);
    }
}
