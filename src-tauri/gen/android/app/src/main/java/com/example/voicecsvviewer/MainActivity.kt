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
        ? window.__EXISTING_TITLES.map(function(t) { return String(t).trim(); }).filter(Boolean)
        : []
    );
    const results = new Map();

    // 対象ジャンル
    const ALLOWED_GENRES = { 'ボイス': true, 'コミック': true, 'CG': true, '動画': true };

    window.ScraperBridge && window.ScraperBridge.onProgress('ライブラリを読み込み中...');

    function findGenre(card, link) {
      const el =
        card.querySelector('[class*="Genre"] span') ||
        card.querySelector('span[class*="defaultClass"]') ||
        link.querySelector('span[class*="defaultClass"]');
      return el ? el.textContent.trim() : '';
    }

    function findTitle(card, link) {
      const el =
        card.querySelector('[class*="productTitle"] p') ||
        link.querySelector('[class*="productTitle"] p') ||
        link.querySelector('p');
      return el ? el.textContent.trim() : '';
    }

    function findCircle(card, link) {
      const el =
        card.querySelector('[class*="circleName"]') ||
        link.querySelector('[class*="circleName"]');
      return el ? el.textContent.trim() : '';
    }

    function findThumbnail(productId, genre) {
      var typeMap = { 'ボイス': 'voice', 'コミック': 'comic', 'CG': 'cg', '動画': 'cg' };
      var type = typeMap[genre] || 'voice';
      return 'https://doujin-assets.dmm.co.jp/digital/' + type + '/' + productId + '/' + productId + 'pr.jpg';
    }

    var hitDuplicate = false;
    function extract() {
      document
        .querySelectorAll('a[href*="/mylibrary/detail/"][href*="product_id="]')
        .forEach(function(link) {
          if (hitDuplicate) return;
          const m = link.href.match(/product_id=([\w]+)/);
          if (!m) return;

          const id = m[1];
          if (results.has(id)) return;

          const card =
            link.closest('div[class*="localListProduct"]') ||
            link.closest('li') ||
            link.parentElement ||
            document.body;

          const genre = findGenre(card, link);
          if (!ALLOWED_GENRES[genre]) return;

          const title = findTitle(card, link);
          if (!title) return;
          if (knownTitles.has(title)) { hitDuplicate = true; return; }

          results.set(id, {
            title: title,
            circle: findCircle(card, link),
            productUrl: 'https://www.dmm.co.jp/dc/-/mylibrary/detail/=/product_id=' + id + '/',
            thumbnailUrl: findThumbnail(id, genre),
            actors: [],
            genre: genre
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
      window.ScraperBridge && window.ScraperBridge.onError('対象作品が見つかりませんでした。ライブラリページを開いてください。');
      return;
    }

    // ── 詳細ページから声優・作者を取得するヘルパー ──────────────────────────
    async function fetchCreators(id, genre) {
      try {
        const res = await fetch('https://www.dmm.co.jp/dc/doujin/-/detail/=/cid=' + id + '/');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // 指定ラベルの名前リストを取得（新旧レイアウト両対応）
        function getField(label) {
          // 新レイアウト: dt.contentDetailData-hdg + dd.contentDetailData-box
          const headings = doc.querySelectorAll('dt.contentDetailData-hdg');
          for (var h = 0; h < headings.length; h++) {
            if (headings[h].textContent.trim() === label) {
              const dd = headings[h].nextElementSibling;
              if (dd) {
                const anchors = dd.querySelectorAll('a');
                if (anchors.length > 0)
                  return Array.from(anchors).map(function(a) { return a.textContent.trim(); }).filter(Boolean);
                return dd.textContent.split('/').map(function(t) { return t.trim(); }).filter(Boolean);
              }
            }
          }
          // 旧レイアウト: .informationList
          const lists = doc.querySelectorAll('.informationList');
          for (var j = 0; j < lists.length; j++) {
            const ttl = lists[j].querySelector('.informationList__ttl');
            if (ttl && ttl.textContent.trim() === label) {
              const anchors = lists[j].querySelectorAll('.informationList__txt a');
              return Array.from(anchors).map(function(a) { return a.textContent.trim(); }).filter(Boolean);
            }
          }
          return [];
        }

        // ジャンル別に取得するフィールドを決定
        if (genre === 'ボイス') {
          return getField('声優');
        } else if (genre === 'コミック' || genre === 'CG') {
          return getField('作者');
        } else if (genre === '動画') {
          // 作者・声優の両方を重複なしで結合
          const authors = getField('作者');
          const voices  = getField('声優');
          const seen = {};
          return authors.concat(voices).filter(function(name) {
            if (seen[name]) return false;
            seen[name] = true;
            return true;
          });
        }
        return [];
      } catch(e) { return []; }
    }

    for (var i = 0; i < items.length; i++) {
      const id   = items[i][0];
      const item = items[i][1];
      window.ScraperBridge && window.ScraperBridge.onProgress(
        '情報取得中... ' + (i + 1) + ' / ' + items.length + '  [' + item.genre + '] ' + item.title.slice(0, 18)
      );
      item.actors = await fetchCreators(id, item.genre);
      await delay(300);
    }

    const payload = items.map(function(entry) {
      const item = entry[1];
      return {
        title: item.title,
        circle: item.circle,
        productUrl: item.productUrl,
        thumbnailUrl: item.thumbnailUrl,
        actors: item.actors,
        genre: item.genre
      };
    });
    window.ScraperBridge && window.ScraperBridge.onScrapedData(JSON.stringify(payload));

  } catch(e) {
    window.ScraperBridge && window.ScraperBridge.onError(String(e));
  }
})();
"""
