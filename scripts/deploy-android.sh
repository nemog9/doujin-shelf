#!/usr/bin/env bash
set -e

APK="src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"

if [ ! -f "$APK" ]; then
  echo "Error: APK not found at $APK"
  exit 1
fi

# デバイス確認
DEVICES=$("$ADB" devices | grep -v "^List" | grep "device$" | awk '{print $1}')
if [ -z "$DEVICES" ]; then
  echo "Error: Androidデバイスが見つかりません"
  echo "USBデバッグを有効にして接続してください"
  exit 1
fi

DEVICE_COUNT=$(echo "$DEVICES" | wc -l | tr -d ' ')
if [ "$DEVICE_COUNT" -gt 1 ]; then
  echo "接続デバイス一覧:"
  echo "$DEVICES"
  echo ""
  read -r -p "使用するデバイスIDを入力: " DEVICE_ID
else
  DEVICE_ID="$DEVICES"
  echo "検出: $DEVICE_ID"
fi

echo "インストール中..."
"$ADB" -s "$DEVICE_ID" install -r "$APK"

echo "起動中..."
"$ADB" -s "$DEVICE_ID" shell am start -n "com.nemog.doujinshelf/.MainActivity"

echo "完了"
