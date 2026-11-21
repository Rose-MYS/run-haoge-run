package app.haoge.runner.local;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.IOException;

public final class MainActivity extends Activity {
    private static final String GAME_URL = "https://appassets.androidplatform.net/assets/game.html";
    private WebView game;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        game = new WebView(this);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!GAME_URL.equals(request.getUrl().toString())) return null;
                try {
                    return new WebResourceResponse("text/html", "UTF-8", getAssets().open("game.html"));
                } catch (IOException missing) {
                    return new WebResourceResponse("text/plain", "UTF-8", null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !GAME_URL.equals(request.getUrl().toString());
            }
        });
        setContentView(game);
        game.loadUrl(GAME_URL);
    }

    @Override
    protected void onPause() {
        if (game != null) {
            game.evaluateJavascript(
                "if (window.__gameDebug?.S.mode === 'playing') document.getElementById('pauseBtn').click()",
                null
            );
            game.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (game != null) game.onResume();
    }
}
