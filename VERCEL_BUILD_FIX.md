# Vercelビルドエラー修正方法

## エラー内容
```
Type error: Type 'typeof import("/vercel/path0/app/api/analysis/save/route")' has no properties in common with type 'RouteHandlerConfig<"/api/analysis/save">'.
```

## 原因
`app/api/analysis/save/route.ts`を削除しましたが、Vercelのビルドキャッシュが古いファイル構造を参照している可能性があります。

## 解決方法

### 方法1: Vercelのビルドキャッシュをクリア（推奨）

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. **Settings** → **General** を開く
4. 下にスクロールして **「Clear Build Cache」** をクリック
5. 再度デプロイを実行

### 方法2: 新しいデプロイをトリガー

1. 空のコミットを作成してプッシュ：
   ```bash
   git commit --allow-empty -m "Clear build cache"
   git push
   ```
2. Vercelが自動的に新しいデプロイを開始します

### 方法3: プロジェクトを再インポート

1. Vercelダッシュボードでプロジェクトを削除
2. 再度同じリポジトリからインポート
3. 環境変数を再設定
4. デプロイ

## 確認事項

以下のファイルが削除されていることを確認：
- ✅ `app/api/analysis/save/route.ts` - 削除済み
- ✅ `app/api/analysis/save/` ディレクトリ - 削除済み

`saveAnalysis`関数は`app/actions.ts`に移動済みです。

## 現在の状態

- `saveAnalysis`は`app/actions.ts`にあります
- `app/page.tsx`は`./actions`からインポートしています
- `app/api/analysis/save/route.ts`は削除済み

## 次のステップ

1. Vercelのビルドキャッシュをクリア
2. 再デプロイを実行
3. エラーが解消されることを確認

