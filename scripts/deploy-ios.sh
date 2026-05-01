#!/bin/bash
set -e

# ---- 設定 ----
APP_NAME="DoujinShelf"
BUILD_TYPE="${1:-release}"  # 引数なし = release、"debug" も可

# ---- デバイス検出 ----
echo "🔍 接続中のiPhoneを検索..."
DEVICE_LINE=$(xcrun devicectl list devices 2>/dev/null \
  | grep -E "iPhone|iPad" \
  | grep "connected" \
  | head -1)

if [ -z "$DEVICE_LINE" ]; then
  echo "❌ 接続中のiPhoneが見つかりません。USBで接続してください。"
  exit 1
fi

# UUID形式（8-4-4-4-12）で抽出
DEVICE_ID=$(echo "$DEVICE_LINE" \
  | grep -oE '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}' \
  | head -1)

DEVICE_NAME=$(echo "$DEVICE_LINE" | awk '{print $1}')

echo "📱 検出: $DEVICE_NAME ($DEVICE_ID)"

# ---- .app パス解決 ----
DERIVED_DATA=$(defaults read com.apple.dt.Xcode IDECustomDerivedDataLocation 2>/dev/null || echo "$HOME/Library/Developer/Xcode/DerivedData")

APP_PATH=$(find "$DERIVED_DATA" -path "*/doujin-shelf-*/${BUILD_TYPE}-iphoneos/${APP_NAME}.app" -maxdepth 8 2>/dev/null \
  | xargs -I{} stat -f "%m %N" {} 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

if [ -z "$APP_PATH" ]; then
  echo "❌ ${BUILD_TYPE} ビルドの .app が見つかりません。先に 'pnpm build:ios' を実行してください。"
  exit 1
fi

echo "📦 インストール: $APP_PATH"

# ---- インストール ----
xcrun devicectl device install app \
  --device "$DEVICE_ID" \
  "$APP_PATH"

echo "✅ インストール完了！iPhoneでアプリを開いてください。"
