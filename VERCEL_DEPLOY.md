# Vercelデプロイ手順

## 事前準備

### 1. データベースの移行（重要）

現在SQLiteを使用していますが、Vercelでは**PostgreSQL**が必要です。

#### オプションA: Vercel Postgres（推奨・簡単）

1. Vercelでプロジェクトを作成後、**Storage**タブから**Postgres**を追加
2. データベース名を入力して作成
3. `.env.local`に`DATABASE_URL`が自動的に追加されます

#### オプションB: Supabase（無料プランあり）

1. [Supabase](https://supabase.com/)でアカウント作成
2. 新しいプロジェクトを作成
3. Settings → Database → Connection string から接続文字列を取得

#### オプションC: Neon（無料プランあり）

1. [Neon](https://neon.tech/)でアカウント作成
2. 新しいプロジェクトを作成
3. 接続文字列を取得

### 2. Prismaスキーマの更新

データベースをPostgreSQLに変更する必要があります。

`prisma/schema.prisma`を以下のように変更：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

その後、マイグレーションを実行：

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## デプロイ手順（Web UI）

### ステップ1: Vercelにログイン

1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」または「Log In」をクリック
3. GitHubアカウントでログイン（推奨）

### ステップ2: プロジェクトをインポート

1. ダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリ `Ryo66-git/sns-decision-making` を選択
3. 「Import」をクリック

### ステップ3: プロジェクト設定

以下の設定を確認・変更：

- **Framework Preset**: Next.js（自動検出されるはず）
- **Root Directory**: `./`（デフォルト）
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `npm install`（デフォルト）

### ステップ4: 環境変数の設定

**「Environment Variables」セクションで以下を追加：**

#### 必須環境変数

```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
NEXTAUTH_SECRET=<ランダムな文字列>
NEXTAUTH_URL=https://your-app.vercel.app
GEMINI_API_KEY=AIza...
```

#### メール送信用（パスワードリセット機能）

```
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

**注意**: 
- `NEXTAUTH_URL`は最初は仮のURLで設定し、デプロイ後に実際のURLに更新
- 環境変数は**Production**、**Preview**、**Development**すべてに設定することを推奨

### ステップ5: デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機（数分かかります）

### ステップ6: データベースマイグレーション

デプロイ後、データベースのマイグレーションを実行：

#### 方法1: Vercel CLIを使用（推奨）

```bash
# Vercel CLIをインストール
npm i -g vercel

# ログイン
vercel login

# プロジェクトをリンク
vercel link

# マイグレーション実行
npx prisma migrate deploy
```

#### 方法2: ローカルから実行

```bash
# 環境変数を設定してマイグレーション
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

### ステップ7: NEXTAUTH_URLの更新

デプロイ後、実際のURLが分かったら：

1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. `NEXTAUTH_URL`を実際のURL（例: `https://sns-decision-making.vercel.app`）に更新
3. 再デプロイ

## トラブルシューティング

### ビルドエラー: Prisma Client not found

`package.json`に`postinstall`スクリプトが追加されていることを確認：

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### ビルドエラー: Database connection

- `DATABASE_URL`が正しく設定されているか確認
- データベースの接続許可設定を確認（IPアドレス制限など）

### ビルドエラー: Environment variables

- すべての環境変数が設定されているか確認
- Production、Preview、Developmentすべてに設定されているか確認

### ランタイムエラー: NEXTAUTH_SECRET

- `NEXTAUTH_SECRET`が設定されているか確認
- 強力なランダム文字列であることを確認

## デプロイ後の確認

1. **アプリケーションが正常に動作するか確認**
   - トップページが表示されるか
   - ログイン機能が動作するか

2. **データベース接続の確認**
   - ユーザー登録ができるか
   - 分析結果が保存されるか

3. **環境変数の確認**
   - Vercelダッシュボードで環境変数が正しく設定されているか

## 今後の更新

コードを更新したら、GitHubにプッシュするだけで自動的にデプロイされます：

```bash
git add .
git commit -m "Update"
git push
```

Vercelが自動的に新しいデプロイを開始します。

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

