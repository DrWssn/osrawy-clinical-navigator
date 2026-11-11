package com.osrawy.clinicalnavigator;

import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupSystemBars();
        setupWebView();
        setupPrintInterface();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupSystemBars();
        setupWebView();
        setupPrintInterface();
    }

    private void setupSystemBars() {
        try {
            Window window = getWindow();
            if (window != null) {
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                int brandTeal = Color.parseColor("#0A4F4B");
                window.setStatusBarColor(brandTeal);
                window.setNavigationBarColor(brandTeal);
            }
        } catch (Exception ignored) {
        }
    }

    private void setupWebView() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
            }
        } catch (Exception ignored) {
        }
    }

    private void setupPrintInterface() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().addJavascriptInterface(new PrintInterface(), "AndroidPrint");
            }
        } catch (Exception ignored) {
        }
    }

    public class PrintInterface {
        @JavascriptInterface
        public void print() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                        if (printManager != null && getBridge() != null && getBridge().getWebView() != null) {
                            PrintDocumentAdapter printAdapter = getBridge().getWebView().createPrintDocumentAdapter("Osrawy_Clinical_Prescription");
                            printManager.print("Osrawy Clinical Prescription", printAdapter, new PrintAttributes.Builder().build());
                        }
                    } catch (Exception ignored) {
                    }
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "(function(){ return (window.handleAndroidBack && window.handleAndroidBack()) ? 'true' : 'false'; })();",
                value -> {
                    if (!"\"true\"".equals(value) && !"true".equals(value)) {
                        runOnUiThread(MainActivity.super::onBackPressed);
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }
}
