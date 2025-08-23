# SVG to PNG Converter

ブラウザ上でSVGファイルをPNG形式に変換するクライアントサイドWebアプリケーションです。

## 🌟 特徴

- **プライバシー重視**: ファイルはサーバーにアップロードされず、すべてブラウザ内で処理
- **ドラッグ&ドロップ対応**: 直感的なファイルアップロード体験
- **リアルタイムプレビュー**: SVGとPNGの両方をプレビュー表示
- **レスポンシブデザイン**: デスクトップ、タブレット、モバイルに対応
- **日本語インターフェース**: すべてのUIテキストが日本語
- **高度な変換オプション**: 透明背景、カスタムサイズ設定

## 🚀 使い方

1. **ファイルの選択**
   - ドラッグ&ドロップでSVGファイルを選択
   - または「ファイルを選択」ボタンをクリック

2. **プレビュー確認**
   - アップロードしたSVGファイルのプレビューを確認

3. **変換設定**
   - 透明背景の有効/無効を選択
   - 出力サイズを設定（オリジナル、カスタムサイズ）

4. **変換実行**
   - 「PNGに変換」ボタンをクリック
   - 変換されたPNGのプレビューを確認

5. **ダウンロード**
   - 「PNGをダウンロード」ボタンでファイルを保存

## 🛠️ 技術仕様

### 使用技術
- **HTML5**: セマンティックマークアップ
- **CSS3**: モダンスタイリング（Flexbox、Grid、グラデーション）
- **Vanilla JavaScript**: ES6+機能、外部ライブラリ不使用
- **Canvas API**: SVGからPNGへの変換処理
- **File API**: ファイル読み込み処理
- **Drag and Drop API**: ドラッグ&ドロップ機能

### ブラウザ対応
- Chrome (推奨)
- Firefox
- Safari
- Edge
- モバイルブラウザ（iOS Safari、Android Chrome）

### ファイル制限
- **対応形式**: SVG (.svg)
- **最大ファイルサイズ**: 10MB
- **出力形式**: PNG

## 📁 プロジェクト構造

```
svg-to-png-converter/
├── index.html          # メインアプリケーションファイル
├── styles.css          # スタイルシート
├── script.js           # JavaScript ロジック
├── README.md           # このファイル
├── USAGE.md            # 詳細な使用方法
├── sample-images/      # サンプルSVGファイル
│   ├── requested-icon.svg
│   ├── requested-icon-gray.svg
│   └── requested-icon-864AF6.svg
├── test*.svg           # テスト用SVGファイル
└── .kiro/              # Kiro IDE設定
    ├── specs/          # 機能仕様書
    └── steering/       # AI アシスタント ガイダンス
```

## 🏗️ アーキテクチャ

### クラス構成
- **AppState**: 中央集権的な状態管理
- **FileHandler**: ファイル操作とバリデーション
- **SVGConverter**: 変換ロジック
- **UIController**: UI操作とイベント管理

### 設計パターン
- **イベント駆動アーキテクチャ**: 状態変更によるUI更新
- **関心の分離**: データ、ロジック、プレゼンテーションの明確な境界
- **クラスベース組織**: 異なる関心事を別々のクラスに分離

## 🚀 開発・実行方法

### ローカル開発
```bash
# リポジトリをクローン
git clone https://github.com/clshinji/image-conversion.git
cd image-conversion

# ブラウザで直接開く
open index.html

# または、ローカルサーバーを使用
python -m http.server 8000
# http://localhost:8000 でアクセス
```

### テスト
- ブラウザの開発者ツールを使用
- 様々なSVGファイルでの手動テスト
- レスポンシブデザインの確認

## 🔧 カスタマイズ

### スタイルの変更
`styles.css`でカラーテーマやレイアウトをカスタマイズできます。

### 機能の拡張
`script.js`で新しい変換オプションや機能を追加できます。

### 言語の変更
`index.html`のテキストコンテンツを変更することで他言語に対応できます。

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。

## 📞 サポート

問題や質問がある場合は、[GitHubのIssuesページ](https://github.com/clshinji/image-conversion/issues)でお知らせください。

## 🔗 リンク

- **リポジトリ**: https://github.com/clshinji/image-conversion
- **デモサイト**: https://clshinji.github.io/image-conversion/

---

**注意**: このアプリケーションはクライアントサイドのみで動作し、ファイルがサーバーに送信されることはありません。すべての処理はブラウザ内で完結します。