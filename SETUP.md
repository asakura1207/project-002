# ジュース記録アプリ セットアップ手順

## 1. 依存パッケージのインストール

```bash
npm install
```

## 2. 楽天アプリIDの設定

`src/lib/api.ts` の先頭にある定数を書き換えてください：

```ts
const RAKUTEN_APP_ID = 'YOUR_RAKUTEN_APP_ID';
// ↓ 楽天デベロッパーサイトで取得したIDに変更
const RAKUTEN_APP_ID = '1234567890123456789';
```

楽天デベロッパーサイト: https://webservice.rakuten.co.jp/

## 3. EAS Build の設定（実機ビルド必須）

react-native-vision-camera はネイティブコードを含むため、
**Expo Go では動作しません**。EAS Build またはベアワークフローが必要です。

```bash
npm install -g eas-cli
eas login
eas build:configure
```

## 4. app.json の修正

以下を自分の情報に書き換えてください：
- `ios.bundleIdentifier`: 例 `com.yourname.juicerecord`
- `android.package`: 例 `com.yourname.juicerecord`
- `extra.eas.projectId`: EAS で発行されるプロジェクトID

## 5. ビルドと実行

```bash
# 開発用ビルド（実機）
eas build --profile development --platform ios
eas build --profile development --platform android

# 本番ビルド
eas build --profile production --platform all
```

## 6. assets フォルダの準備

以下のファイルを `assets/` に追加してください：
- `icon.png` — 1024×1024px
- `splash.png` — 1242×2436px
- `adaptive-icon.png` — 1024×1024px（Android用）
- `favicon.png` — 196×196px（Web用）

## ファイル構成

```
juice-claude/
├── App.tsx                          # ナビゲーション・DB初期化
├── app.json                         # Expo設定・権限
├── package.json
├── tsconfig.json
├── babel.config.js
└── src/
    ├── types/index.ts               # 型定義・ナビゲーション型
    ├── lib/
    │   ├── db.ts                    # SQLite操作
    │   └── api.ts                   # 楽天API
    ├── components/
    │   └── StarRating.tsx           # 星評価コンポーネント
    └── screens/
        ├── HomeScreen.tsx           # ホーム
        ├── BarcodeScannerScreen.tsx # バーコードスキャン
        ├── SearchResultScreen.tsx   # 商品確認・評価入力
        ├── HistoryListScreen.tsx    # 履歴一覧
        └── DetailScreen.tsx         # 詳細表示
```
