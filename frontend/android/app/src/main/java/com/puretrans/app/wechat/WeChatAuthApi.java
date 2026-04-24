package com.puretrans.app.wechat;

public interface WeChatAuthApi {
    boolean isWeChatInstalled();

    boolean registerApp(String appId);

    boolean sendAuthorization(String scope, String state);
}
