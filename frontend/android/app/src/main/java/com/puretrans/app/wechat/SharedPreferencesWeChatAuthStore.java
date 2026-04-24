package com.puretrans.app.wechat;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.Nullable;

public class SharedPreferencesWeChatAuthStore implements WeChatAuthPersistence.WeChatAuthStore {
    private static final String PREFERENCES_NAME = "puretrans_wechat_auth";

    private final SharedPreferences sharedPreferences;

    public SharedPreferencesWeChatAuthStore(Context context) {
        this.sharedPreferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
    }

    @Override
    @Nullable
    public String getString(String key) {
        return sharedPreferences.getString(key, null);
    }

    @Override
    public void putString(String key, String value) {
        sharedPreferences.edit().putString(key, value).apply();
    }

    @Override
    public void remove(String key) {
        sharedPreferences.edit().remove(key).apply();
    }
}
