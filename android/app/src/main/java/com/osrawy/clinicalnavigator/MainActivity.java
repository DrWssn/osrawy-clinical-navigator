package com.osrawy.clinicalnavigator;

import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "OsrawyMainActivity";
    private boolean webViewConfigured = false;
    private OnBackPressedCallback backCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupSystemBars();
        setupBackNavigation();
        configureWebViewOnce();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupSystemBars();
        configureWebViewOnce();
    }

    private void setupSystemBars() {
        try {
            Window window = getWindow();
            if (window == null) return;

            // Keep WebView cleanly framed between system bars so adjustResize works
            // without notch clipping or double safe-area padding (targetSdk 34).
            WindowCompat.setDecorFitsSystemWindows(window, true);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

            int brandTeal = Color.parseColor("#0A4F4B");
            window.setStatusBarColor(brandTeal);
            window.setNavigationBarColor(brandTeal);

            // Force crisp white status & navigation icons over dark #0A4F4B bars
            WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(window, window.getDecorView());
            if (controller != null) {
                controller.setAppearanceLightStatusBars(false);
                controller.setAppearanceLightNavigationBars(false);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to configure system bars", e);
        }
    }

    private void configureWebViewOnce() {
        if (webViewConfigured) return;
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);

                // Cap extreme Android system font zoom so sticky clinical headers don't break
                WebSettings settings = webView.getSettings();
                if (settings.getTextZoom() > 115) {
                    settings.setTextZoom(115);
                }

                webView.addJavascriptInterface(new PrintInterface(), "AndroidPrint");
                webViewConfigured = true;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to configure WebView", e);
        }
    }

    private void setupBackNavigation() {
        backCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "(function(){ return (window.handleAndroidBack && window.handleAndroidBack()) ? 'true' : 'false'; })();",
                        value -> {
                            if (!"\"true\"".equals(value) && !"true".equals(value)) {
                                runOnUiThread(() -> {
                                    backCallback.setEnabled(false);
                                    getOnBackPressedDispatcher().onBackPressed();
                                    backCallback.setEnabled(true);
                                });
                            }
                        }
                    );
                } else {
                    backCallback.setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    backCallback.setEnabled(true);
                }
            }
        };
        getOnBackPressedDispatcher().addCallback(this, backCallback);
    }

    public class PrintInterface {
        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                try {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null && getBridge() != null && getBridge().getWebView() != null) {
                        PrintDocumentAdapter printAdapter =
                            getBridge().getWebView().createPrintDocumentAdapter("Osrawy_Clinical_Prescription");
                        printManager.print(
                            "Osrawy Clinical Prescription",
                            printAdapter,
                            new PrintAttributes.Builder().build()
                        );
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Failed to launch Android print dialog", e);
                }
            });
        }
    }
}
