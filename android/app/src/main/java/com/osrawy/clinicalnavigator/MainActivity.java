package com.osrawy.clinicalnavigator;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupPrintInterface();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupPrintInterface();
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
