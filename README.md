# SNS投稿 意思決定ツール

AIがあなたのSNS投稿を定性・定量分析し、次回投稿の改善案を提供、投稿に必要な意思決定をサポートします。

## 機能

- **投稿前・投稿後の分析**: 投稿前の意思決定支援と投稿後のパフォーマンス分析
- **定性・定量分析**: AIによる詳細な分析と改善提案
- **意思決定支援**: GO/HOLD/NO-GO判定とブランドセーフティ評価
- **分析履歴**: 過去の分析結果の閲覧とPDFエクスポート
- **画像・動画対応**: 投稿に添付された画像や動画の分析

## 技術スタック

- **フレームワーク**: Next.js 16.1.1
- **言語**: TypeScript
- **認証**: NextAuth.js
- **データベース**: Prisma (SQLite / PostgreSQL)
- **AI**: Google Gemini API
- **スタイリング**: Tailwind CSS

## セットアップ

### 必要な環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース
DATABASE_URL="file:./dev.db"  # 開発環境（SQLite）
# または
# DATABASE_URL="postgresql://..."  # 本番環境（PostgreSQL）

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# メール送信（パスワードリセット機能）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

### インストール

```bash
npm install
```

### データベースのセットアップ

```bash
# マイグレーション実行
npx prisma migrate dev

# Prisma Clientの生成
npx prisma generate
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## デプロイ

詳細なデプロイ手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### クイックスタート（Vercel）

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com/)でプロジェクトをインポート
3. 環境変数を設定
4. データベースをPostgreSQLに移行
5. デプロイ

## スクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルド
- `npm run start` - 本番サーバーを起動
- `npm run lint` - ESLintでコードをチェック
- `npm run db:migrate` - データベースマイグレーション（本番環境）
- `npm run db:push` - データベーススキーマをプッシュ（開発環境）

## ライセンス

このプロジェクトはプライベートプロジェクトです。
