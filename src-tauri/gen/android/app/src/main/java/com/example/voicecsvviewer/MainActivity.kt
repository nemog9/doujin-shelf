package com.example.voicecsvviewer

import android.annotation.SuppressLint
import android.app.Activity
import android.app.Dialog
import android.content.res.Resources
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.*
import android.webkit.*
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.browser.customtabs.CustomTabsIntent

// ─── MainActivity ──────────────────────────────────────────────────────────────

class MainActivity : TauriActivity() {
  internal lateinit var mainWebView: WebView

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  @SuppressLint("JavascriptInterface")
  override fun onWebViewCreate(webView: WebView) {
    mainWebView = webView
    webView.addJavascriptInterface(AppBridgeInterface(this), "AppBridge")
  }
}

// ─── AppBridgeInterface ────────────────────────────────────────────────────────
// TypeScript 側で window.AppBridge として使用

class AppBridgeInterface(private val activity: MainActivity) {

  /** Chrome Custom Tabs でURLを開く */
  @JavascriptInterface
  fun openUrl(url: String) {
    activity.runOnUiThread {
      try {
        CustomTabsIntent.Builder().setShowTitle(true).build()
          .launchUrl(activity, Uri.parse(url))
      } catch (e: Exception) {
        android.util.Log.e("AppBridge", "openUrl error: ${e.message}")
      }
    }
  }

  /** DMMライブラリスクレイパーダイアログを開く */
  @JavascriptInterface
  fun startDmmScraper(existingTitlesJson: String?, keepAwake: Boolean) {
    activity.runOnUiThread {
      DmmScraperDialog(activity, existingTitlesJson ?: "[]", keepAwake).show()
    }
  }
}

// ─── DmmScraperDialog ─────────────────────────────────────────────────────────

@SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
class DmmScraperDialog(
  private val activity: MainActivity,
  private val existingTitlesJson: String,
  private val keepAwake: Boolean,
) :
  Dialog(activity, android.R.style.Theme_Black_NoTitleBar_Fullscreen) {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window?.requestFeature(Window.FEATURE_NO_TITLE)
    if (keepAwake) {
      activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    val root = FrameLayout(activity)
    setContentView(root)

    val wv = buildScraperWebView()
    root.addView(wv, matchParent())

    val progressTv = buildProgressView()
    val scrapeBtn = buildScrapeButton(wv, progressTv)
    val closeBtn = buildCloseButton()

    root.addView(progressTv, bottomCenterParams(dp(88)))
    root.addView(scrapeBtn, bottomCenterParams(dp(32)))
    root.addView(closeBtn, topRightParams())

    wv.addJavascriptInterface(ScraperBridgeInterface(activity, this, progressTv, scrapeBtn), "ScraperBridge")

    wv.webViewClient = object : WebViewClient() {
      override fun onPageFinished(view: WebView, url: String) {
        val onLibrary = url.contains("mylibrary") && !url.contains("detail")
        activity.runOnUiThread {
          scrapeBtn.visibility = if (onLibrary) View.VISIBLE else View.GONE
        }
      }
    }

    wv.loadUrl("https://www.dmm.co.jp/dc/-/mylibrary/")
  }

  private fun buildScraperWebView(): WebView = WebView(activity).apply {
    settings.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
      // モバイルChromeとして認識させる
      userAgentString = "Mozilla/5.0 (Linux; Android 14; Pixel 8) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/124.0.0.0 Mobile Safari/537.36"
    }
    webChromeClient = WebChromeClient()
    CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
  }

  private fun buildCloseButton(): Button = Button(activity).apply {
    text = "✕  閉じる"
    setTextColor(Color.WHITE)
    setBackgroundColor(Color.argb(200, 20, 20, 40))
    textSize = 14f
    setPadding(dp(16), dp(8), dp(16), dp(8))
    setOnClickListener { dismiss() }
  }

  private fun buildScrapeButton(wv: WebView, progressTv: TextView): Button =
    Button(activity).apply {
      text = "▶  このページから取得"
      visibility = View.GONE
      setTextColor(Color.WHITE)
      setBackgroundColor(Color.argb(230, 109, 40, 217)) // violet-700
      textSize = 15f
      setPadding(dp(24), dp(12), dp(24), dp(12))
      setOnClickListener {
        isEnabled = false
        text = "取得中..."
        progressTv.visibility = View.VISIBLE
        progressTv.text = "ライブラリを読み込み中..."
        val script = "window.__EXISTING_TITLES = $existingTitlesJson;\n$SCRAPE_SCRIPT"
        wv.evaluateJavascript(script, null)
      }
    }

  private fun buildProgressView(): TextView = TextView(activity).apply {
    setTextColor(Color.WHITE)
    textSize = 13f
    setBackgroundColor(Color.argb(200, 0, 0, 0))
    setPadding(dp(16), dp(10), dp(16), dp(10))
    visibility = View.GONE
  }

  // ── layout helpers ──
  private fun matchParent() = FrameLayout.LayoutParams(
    ViewGroup.LayoutParams.MATCH_PARENT,
    ViewGroup.LayoutParams.MATCH_PARENT
  )

  private fun bottomCenterParams(bottomMarginPx: Int) = FrameLayout.LayoutParams(
    FrameLayout.LayoutParams.WRAP_CONTENT,
    FrameLayout.LayoutParams.WRAP_CONTENT,
    Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
  ).also { it.bottomMargin = bottomMarginPx }

  private fun topRightParams() = FrameLayout.LayoutParams(
    FrameLayout.LayoutParams.WRAP_CONTENT,
    FrameLayout.LayoutParams.WRAP_CONTENT,
    Gravity.TOP or Gravity.END
  ).also { it.topMargin = dp(48); it.rightMargin = dp(12) }

  private fun dp(v: Int) = (v * Resources.getSystem().displayMetrics.density).toInt()

  override fun dismiss() {
    if (keepAwake) {
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
    super.dismiss()
  }
}

// ─── ScraperBridgeInterface ───────────────────────────────────────────────────
// スクレイピングJS (SCRAPE_SCRIPT) から呼び出される

class ScraperBridgeInterface(
  private val activity: Activity,
  private val dialog: Dialog,
  private val progressTv: TextView,
  private val scrapeBtn: Button,
) {
  @JavascriptInterface
  fun onProgress(message: String) {
    activity.runOnUiThread {
      progressTv.text = message
      progressTv.visibility = View.VISIBLE
    }
  }

  @JavascriptInterface
  fun onScrapedData(json: String) {
    activity.runOnUiThread {
      dialog.dismiss()
      (activity as? MainActivity)?.mainWebView?.evaluateJavascript(
        "window.__onDmmScraped && window.__onDmmScraped($json);",
        null
      )
    }
  }

  @JavascriptInterface
  fun onError(message: String) {
    activity.runOnUiThread {
      scrapeBtn.isEnabled = true
      scrapeBtn.text = "▶  このページから取得"
      progressTv.text = "エラー: $message"
    }
  }
}

// ─── スクレイピングJS ──────────────────────────────────────────────────────────
// Chrome拡張 (dmm-exporter) のロジックを移植

private const val SCRAPE_SCRIPT = """
(async function() {
  try {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const knownTitles = new Set(
      Array.isArray(window.__EXISTING_TITLES)
        ? window.__EXISTING_TITLES.map(function(title) { return String(title).trim(); }).filter(Boolean)
        : []
    );
    const results = new Map();
    let hitDuplicate = false;

    window.ScraperBridge && window.ScraperBridge.onProgress('ライブラリを読み込み中...');

    function findGenre(card, link) {
      const genreEl =
        card.querySelector('[class*="Genre"] span') ||
        card.querySelector('span[class*="defaultClass"]') ||
        link.querySelector('span[class*="defaultClass"]');
      return (genreEl && genreEl.textContent ? genreEl.textContent.trim() : '');
    }

    function findTitle(card, link) {
      const titleEl =
        card.querySelector('[class*="productTitle"] p') ||
        link.querySelector('[class*="productTitle"] p') ||
        link.querySelector('p');
      return (titleEl && titleEl.textContent ? titleEl.textContent.trim() : '');
    }

    function findCircle(card, link) {
      const circleEl =
        card.querySelector('[class*="circleName"]') ||
        link.querySelector('[class*="circleName"]');
      return (circleEl && circleEl.textContent ? circleEl.textContent.trim() : '');
    }

    function findThumbnail(card, link, productId) {
      return 'https://doujin-assets.dmm.co.jp/digital/voice/' + productId + '/' + productId + 'pr.jpg';
    }

    function extract() {
      document
        .querySelectorAll('a[href*="/mylibrary/detail/"][href*="product_id="]')
        .forEach(function(link) {
          const m = link.href.match(/product_id=([\w]+)/);
          if (!m) return;

          const id = m[1];
          const card =
            link.closest('div[class*="localListProduct"]') ||
            link.closest('li') ||
            link.parentElement ||
            document.body;

          const genre = findGenre(card, link);
          if (genre !== 'ボイス') return;

          const title = findTitle(card, link);
          if (!title || results.has(id)) return;
          if (knownTitles.has(title)) {
            hitDuplicate = true;
            return;
          }

          results.set(id, {
            title: title,
            circle: findCircle(card, link),
            productUrl: 'https://www.dmm.co.jp/dc/-/mylibrary/detail/=/product_id=' + id + '/',
            thumbnailUrl: findThumbnail(card, link, id),
            actors: []
          });
          knownTitles.add(title);
        });
    }

    var unchanged = 0, prev = 0;
    while (unchanged < 3) {
      extract();
      if (hitDuplicate) break;
      const loader = document.querySelector(
        '#loading, [class*="ajaxArea"], [class*="loadingIcon"], img[alt*="ローディング"]'
      );
      if (loader) loader.scrollIntoView({behavior: 'smooth'});
      else window.scrollTo(0, document.body.scrollHeight);
      await delay(2500);
      const curr = results.size;
      window.ScraperBridge && window.ScraperBridge.onProgress(curr + ' 件読み込み中...');
      if (curr === prev) unchanged++;
      else unchanged = 0;
      prev = curr;
    }

    const items = Array.from(results.entries());
    if (items.length === 0) {
      window.ScraperBridge && window.ScraperBridge.onError('ボイス作品が見つかりませんでした。ライブラリページを開いてください。');
      return;
    }

    for (var i = 0; i < items.length; i++) {
      const id = items[i][0];
      const item = items[i][1];
      window.ScraperBridge && window.ScraperBridge.onProgress(
        '声優取得中... ' + (i + 1) + ' / ' + items.length + '  ' + item.title.slice(0, 20)
      );
      try {
        const res = await fetch('https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=' + id + '/');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const detailList = doc.querySelector('.c_list_contentDetailData');
        if (detailList) {
          const headings = detailList.querySelectorAll('dt.contentDetailData-hdg');
          for (var j = 0; j < headings.length; j++) {
            const ttl = headings[j];
            if (ttl && ttl.textContent.trim() === '声優') {
              const detailBox = ttl.nextElementSibling;
              if (detailBox && detailBox.matches('dd.contentDetailData-box')) {
                const anchors = detailBox.querySelectorAll('a');
                const actors = Array.from(anchors)
                  .map(function(a) { return a.textContent.trim(); })
                  .filter(Boolean);
                item.actors = actors.length > 0
                  ? actors
                  : detailBox.textContent
                      .split('/')
                      .map(function(text) { return text.trim(); })
                      .filter(Boolean);
              }
              break;
            }
          }
        } else {
          const lists = doc.querySelectorAll('.informationList');
          for (var j = 0; j < lists.length; j++) {
            const ttl = lists[j].querySelector('.informationList__ttl');
            if (ttl && ttl.textContent.trim() === '声優') {
              const anchors = lists[j].querySelectorAll('.informationList__txt a');
              item.actors = Array.from(anchors).map(function(a) { return a.textContent.trim(); }).filter(Boolean);
              break;
            }
          }
        }
      } catch(e) {}
      await delay(300);
    }

    const payload = items.map(function(entry) { return entry[1]; });
    window.ScraperBridge && window.ScraperBridge.onScrapedData(JSON.stringify(payload));

  } catch(e) {
    window.ScraperBridge && window.ScraperBridge.onError(String(e));
  }
})();
"""
