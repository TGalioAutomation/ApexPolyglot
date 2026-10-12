package com.lingovoice.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;

public final class MainActivity extends ComponentActivity {
    private WebView webView;
    private ProgressBar progress;
    private View errorPanel;
    private TextView errorMessage;
    private PermissionRequest pendingPermissionRequest;
    private SpeechRecognizer speechRecognizer;
    private JavaScriptReplyProxy speechReplyProxy;
    private String pendingSpeechLanguage;
    private boolean speechFinalDelivered;
    private final ActivityResultLauncher<String> microphonePermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            this::handleMicrophonePermissionResult
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        View appRoot = findViewById(R.id.app_root);
        ViewCompat.setOnApplyWindowInsetsListener(appRoot, (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return windowInsets;
        });

        webView = findViewById(R.id.web_view);
        progress = findViewById(R.id.loading_progress);
        errorPanel = findViewById(R.id.error_panel);
        errorMessage = findViewById(R.id.error_message);
        Button retry = findViewById(R.id.retry_button);
        retry.setOnClickListener(view -> loadServer());

        configureWebView();
        configureBackNavigation();
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) loadServer();
    }

    @SuppressLint("SetJavaScriptEnabled") // LingoVoice là webapp JS; WebView chỉ điều hướng trong origin đã cấu hình.
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBuiltInZoomControls(false);

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        configureNativeSpeechBridge();
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                errorPanel.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                progress.setVisibility(View.GONE);
                errorMessage.setText(getString(R.string.server_error, BuildConfig.SERVER_URL));
                errorPanel.setVisibility(View.VISIBLE);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String target = request.getUrl().toString();
                if (TrustedOrigin.matches(BuildConfig.SERVER_URL, target)) return false;
                return true;
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                view.destroy();
                recreate();
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleWebPermission(request));
            }

            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingPermissionRequest == request) pendingPermissionRequest = null;
            }
        });
    }

    private void configureNativeSpeechBridge() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        WebViewCompat.addWebMessageListener(
                webView,
                "LingoVoiceSpeech",
                Collections.singleton(TrustedOrigin.rule(BuildConfig.SERVER_URL)),
                (view, message, sourceOrigin, isMainFrame, replyProxy) -> {
                    if (!isMainFrame || !TrustedOrigin.matches(BuildConfig.SERVER_URL, sourceOrigin.toString())) return;
                    handleSpeechBridgeMessage(message, replyProxy);
                }
        );
    }

    private void handleSpeechBridgeMessage(WebMessageCompat message, JavaScriptReplyProxy replyProxy) {
        if (message.getType() != WebMessageCompat.TYPE_STRING || message.getData() == null) return;
        try {
            JSONObject command = new JSONObject(message.getData());
            String type = command.optString("type", "");
            speechReplyProxy = replyProxy;
            if ("start".equals(type)) {
                startNativeSpeech(normalizeSpeechLanguage(command.optString("language", "en-US")));
            } else if ("stop".equals(type)) {
                if (speechRecognizer != null) speechRecognizer.stopListening();
            } else if ("cancel".equals(type)) {
                cancelNativeSpeech(true);
            } else if ("ping".equals(type)) {
                postSpeechEvent("ready", "available", SpeechRecognizer.isRecognitionAvailable(this));
            }
        } catch (JSONException error) {
            postSpeechError("invalid_command");
        }
    }

    private void startNativeSpeech(String language) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            postSpeechError("unavailable");
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            if (pendingPermissionRequest != null) {
                postSpeechError("busy");
                return;
            }
            pendingSpeechLanguage = language;
            microphonePermissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
            return;
        }
        ensureSpeechRecognizer();
        speechFinalDelivered = false;
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
        speechRecognizer.startListening(intent);
        postSpeechEvent("starting");
    }

    private void ensureSpeechRecognizer() {
        if (speechRecognizer != null) return;
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) { postSpeechEvent("listening"); }
            @Override public void onBeginningOfSpeech() { postSpeechEvent("listening"); }
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() { postSpeechEvent("processing"); }
            @Override public void onError(int error) {
                speechFinalDelivered = false;
                postSpeechError(SpeechErrorMapper.code(error));
            }
            @Override public void onResults(Bundle results) {
                String transcript = firstTranscript(results);
                if (transcript == null) {
                    postSpeechError("no_match");
                    return;
                }
                speechFinalDelivered = true;
                postSpeechResult(transcript, results);
            }
            @Override public void onPartialResults(Bundle partialResults) {
                String transcript = firstTranscript(partialResults);
                if (transcript != null) postSpeechEvent("partial", "transcript", transcript);
            }
            @Override public void onEvent(int eventType, Bundle params) {}
        });
    }

    private void postSpeechResult(String transcript, Bundle results) {
        if (speechReplyProxy == null || !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        try {
            JSONObject event = new JSONObject().put("type", "result").put("transcript", transcript);
            JSONArray alternatives = new JSONArray();
            ArrayList<String> matches = results == null
                    ? null
                    : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
            if (matches != null) {
                for (int i = 1; i < matches.size() && alternatives.length() < 4; i++) {
                    String alt = matches.get(i);
                    if (alt != null && !alt.trim().isEmpty()) alternatives.put(alt.trim());
                }
            }
            if (alternatives.length() > 0) event.put("alternatives", alternatives);
            speechReplyProxy.postMessage(event.toString());
        } catch (JSONException ignored) {
            // Keys and values above are controlled by the app and always JSON-safe.
        }
    }

    private static String firstTranscript(Bundle results) {
        ArrayList<String> matches = results == null
                ? null
                : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches == null || matches.isEmpty()) return null;
        String transcript = matches.get(0) == null ? "" : matches.get(0).trim();
        return transcript.isEmpty() ? null : transcript;
    }

    private static String normalizeSpeechLanguage(String language) {
        if (language != null && language.toLowerCase(Locale.ROOT).startsWith("zh")) return "zh-CN";
        if (language != null && language.toLowerCase(Locale.ROOT).startsWith("vi")) return "vi-VN";
        return "en-US";
    }

    private void postSpeechError(String code) {
        postSpeechEvent("error", "code", code);
    }

    private void postSpeechEvent(String type) {
        postSpeechEvent(type, null, null);
    }

    private void postSpeechEvent(String type, String key, Object value) {
        if (speechReplyProxy == null || !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        try {
            JSONObject event = new JSONObject().put("type", type);
            if (key != null) event.put(key, value);
            speechReplyProxy.postMessage(event.toString());
        } catch (JSONException ignored) {
            // Keys and values above are controlled by the app and always JSON-safe.
        }
    }

    private void cancelNativeSpeech(boolean notifyWeb) {
        if (speechRecognizer != null) speechRecognizer.cancel();
        pendingSpeechLanguage = null;
        if (notifyWeb && !speechFinalDelivered) postSpeechEvent("end");
        speechFinalDelivered = false;
    }

    private void configureBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                webView.evaluateJavascript(
                        "Boolean(window.handleLingoVoiceBack && window.handleLingoVoiceBack())",
                        handled -> {
                            if ("true".equals(handled)) return;
                            if (webView.canGoBack()) {
                                webView.goBack();
                                return;
                            }
                            setEnabled(false);
                            getOnBackPressedDispatcher().onBackPressed();
                        }
                );
            }
        });
    }

    private void handleWebPermission(PermissionRequest request) {
        boolean asksForAudio = false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) asksForAudio = true;
        }
        if (!asksForAudio || !TrustedOrigin.matches(BuildConfig.SERVER_URL, request.getOrigin().toString())) {
            request.deny();
            return;
        }
        if (pendingSpeechLanguage != null) {
            request.deny();
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            return;
        }
        pendingPermissionRequest = request;
        microphonePermissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
    }

    private void handleMicrophonePermissionResult(boolean granted) {
        if (pendingSpeechLanguage != null) {
            String language = pendingSpeechLanguage;
            pendingSpeechLanguage = null;
            if (granted) startNativeSpeech(language);
            else postSpeechError("permission_denied");
            return;
        }
        if (pendingPermissionRequest == null) return;
        PermissionRequest request = pendingPermissionRequest;
        pendingPermissionRequest = null;
        if (granted) request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        else request.deny();
    }

    private void loadServer() {
        errorPanel.setVisibility(View.GONE);
        progress.setVisibility(View.VISIBLE);
        webView.loadUrl(BuildConfig.SERVER_URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onStop() {
        cancelNativeSpeech(true);
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        pendingPermissionRequest = null;
        speechReplyProxy = null;
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
        webView.stopLoading();
        webView.destroy();
        super.onDestroy();
    }
}
