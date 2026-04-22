package com.example.voicecsvviewer

import android.app.Activity
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.browser.customtabs.CustomTabsIntent

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  override fun onWebViewCreate(webView: WebView) {
    webView.addJavascriptInterface(InAppBrowserInterface(this), "InAppBrowser")
  }
}

class InAppBrowserInterface(private val activity: Activity) {
  @JavascriptInterface
  fun open(url: String) {
    activity.runOnUiThread {
      try {
        val intent = CustomTabsIntent.Builder()
          .setShowTitle(true)
          .build()
        intent.launchUrl(activity, Uri.parse(url))
      } catch (e: Exception) {
        android.util.Log.e("InAppBrowser", "Failed to open URL: ${e.message}")
      }
    }
  }
}
