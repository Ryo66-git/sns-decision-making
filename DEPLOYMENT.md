# デプロイメント手順書

このWebアプリケーションを公開するための手順です。

## 推奨プラットフォーム

**Vercel**（推奨）
- Next.jsの開発元が提供するプラットフォーム
- 自動デプロイ、HTTPS、CDNが自動設定
- 無料プランあり

## 事前準備

### 1. データベースの移行（重要）

現在SQLiteを使用していますが、Vercelなどのサーバーレス環境では**PostgreSQL**などのサーバーレス対応データベースが必要です。

#### オプションA: Vercel Postgres（推奨）
1. Vercelアカウントでプロジェクトを作成
2. Vercel Postgresを追加
3. 接続文字列を取得

#### オプションB: その他のPostgreSQLサービス
- [Supabase](https://supabase.com/)（無料プランあり）
- [Neon](https://neon.tech/)（無料プランあり）
- [Railway](https://railway.app/)（無料プランあり）

### 2. Prismaスキーマの更新

`prisma/schema.prisma`を以下のように変更：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. 環境変数の準備

以下の環境変数が必要です：

#### 必須環境変数
- `DATABASE_URL`: PostgreSQLの接続文字列
- `NEXTAUTH_SECRET`: NextAuth用の秘密鍵（ランダムな文字列）
- `NEXTAUTH_URL`: アプリケーションのURL（例: `https://your-app.vercel.app`）
- `GEMINI_API_KEY`: Google Gemini APIキー

#### メール送信用（パスワードリセット機能）
- `SMTP_HOST`: SMTPサーバーのホスト名
- `SMTP_PORT`: SMTPポート（通常587または465）
- `SMTP_USER`: SMTPユーザー名
- `SMTP_PASSWORD`: SMTPパスワード
- `SMTP_FROM`: 送信元メールアドレス

## デプロイ手順（Vercel）

### 1. GitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Vercelにプロジェクトをインポート

1. [Vercel](https://vercel.com/)にログイン
2. "Add New Project"をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定：
   - Framework Preset: Next.js
   - Root Directory: `./`（デフォルト）
   - Build Command: `npm run build`（デフォルト）
   - Output Directory: `.next`（デフォルト）

### 3. 環境変数の設定

Vercelのプロジェクト設定で、以下の環境変数を追加：

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<ランダムな文字列>
NEXTAUTH_URL=https://your-app.vercel.app
GEMINI_API_KEY=AIza...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**NEXTAUTH_SECRETの生成方法：**
```bash
openssl rand -base64 32
```

### 4. データベースのマイグレーション

Vercelのデプロイ後、データベースマイグレーションを実行：

**オプション1: Vercel CLIを使用**
```bash
npm i -g vercel
vercel login
vercel link
npx prisma migrate deploy
```

**オプション2: ローカルから実行**
```bash
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

### 5. ビルドの確認

Vercelのデプロイログでビルドが成功することを確認してください。

## トラブルシューティング

### ビルドエラー

1. **Prisma Clientの生成エラー**
   - `package.json`に`postinstall`スクリプトを追加：
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

2. **環境変数のエラー**
   - Vercelの環境変数設定を再確認
   - 本番環境（Production）に設定されているか確認

3. **データベース接続エラー**
   - `DATABASE_URL`が正しく設定されているか確認
   - データベースの接続許可設定を確認

## その他のデプロイオプション

### Netlify
- Next.js対応あり
- 環境変数設定可能
- PostgreSQLは外部サービスが必要

### Railway
- PostgreSQLが統合されている
- 簡単なデプロイ
- 無料プランあり

### AWS / GCP / Azure
- より高度な設定が必要
- スケーラビリティが高い
- コストがかかる可能性

## セキュリティチェックリスト

- [ ] `NEXTAUTH_SECRET`が強力なランダム文字列である
- [ ] 環境変数が本番環境に正しく設定されている
- [ ] データベースの接続がSSL経由である
- [ ] APIキーが漏洩していない
- [ ] CORS設定が適切である

## サポート

問題が発生した場合は、Vercelのドキュメントを参照してください：
- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

