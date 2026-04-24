# DoujinShelf 📚

購入済みの同人作品を管理する Android アプリです。  
ボイス・コミック・動画・CG をまとめて整理・閲覧できます。

---

## 機能

- 📥 **CSV インポート** — 作品リストを CSV で一括登録
- 🔄 **ライブラリ自動取得** — 対応ストアの購入済み作品を Android 上で直接スクレイプ
- 🔍 **検索 & 絞り込み** — タイトル・サークル・アーティスト名で検索、ジャンルフィルター付き
- ♡ **お気に入り** — よく見る作品をすぐ手元に
- 🎲 **ランダム表示** — 次に見る作品を気分に任せて
- 🔗 **作品ページを開く** — アプリ内ブラウザまたは外部ブラウザで作品ページへ

---

## インストール（野良 APK）

Google Play には公開していません。APK を直接インストールします。

1. Android の **設定 → セキュリティ**（または「アプリ」→ Chrome など）で  
   **「提供元不明のアプリ」のインストールを許可**
2. [Releases](../../releases) ページから最新の `.apk` をダウンロード
3. ダウンロードした APK をタップ → **インストール**

> **動作確認端末**: Android 10 以上推奨

---

## CSV フォーマット

以下のヘッダーを含む CSV を読み込めます（順不同・一部省略可）。

| ヘッダー例 | 対応フィールド |
|---|---|
| `タイトル` / `title` | 作品名（必須） |
| `サークル名` / `circle` | サークル・ブランド名 |
| `声優` / `cv` / `actors` | アーティスト名（カンマ区切りで複数可） |
| `URL` / `product_url` | 作品ページ URL（必須） |
| `サムネイル` / `thumbnail_url` | サムネイル画像 URL |

---

## 開発・ビルド

### 必要なもの

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)
- [Tauri CLI v2](https://tauri.app/)
- Android Studio + NDK（Android ビルドのみ）

### セットアップ

```bash
git clone https://github.com/your-username/doujin-shelf.git
cd doujin-shelf
pnpm install
```

### 開発サーバー起動

```bash
pnpm tauri dev
```

### Android APK ビルド（デバッグ）

```bash
pnpm build:android
```

### Android APK ビルド（リリース）

```bash
ANDROID_HOME=~/Library/Android/sdk \
NDK_HOME=~/Library/Android/sdk/ndk/29.0.13599879 \
JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr \
pnpm tauri android build
```

ビルドされた APK は以下に出力されます：

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/
```

---

## 技術スタック

- [Tauri 2](https://tauri.app/) — Rust ベースのモバイル / デスクトップフレームワーク
- [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/) — 状態管理
- Kotlin / Android WebView — ネイティブブリッジ・スクレイパー

---

## ライセンス

MIT
