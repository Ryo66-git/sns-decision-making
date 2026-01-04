# Vercel環境変数設定ガイド

Vercelプロジェクトを再作成する際に設定する環境変数の一覧です。

## 必須環境変数

### 1. DATABASE_URL

**説明**: PostgreSQLデータベースの接続文字列

**取得方法（Supabase使用時）:**
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左メニューから「Settings」→「Database」を選択
4. 「Connection string」セクションで「URI」をコピー
5. パスワード部分 `[YOUR-PASSWORD]` を実際のパスワードに置き換える

**形式:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**例:**
```
postgresql://postgres:mypassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

### 2. NEXTAUTH_SECRET

**説明**: NextAuth.js用の秘密鍵（セッションの暗号化に使用）

**生成方法:**
ターミナルで以下のコマンドを実行：
```bash
openssl rand -base64 32
```

**例:**
```
Xk9pL2mN4qR7sT1uV3wY5zA8bC0dE2fG4hI6jK8lM0nO2pQ4rS6tU8vW0xY2z
```

**重要**: 強力なランダム文字列である必要があります。32文字以上の文字列を推奨します。

---

### 3. NEXTAUTH_URL

**説明**: アプリケーションの公開URL

**設定方法:**
1. 最初は仮のURLで設定（例: `https://sns-decision-making.vercel.app`）
2. デプロイ後に実際のURLが分かったら更新

**形式:**
```
https://your-app-name.vercel.app
```

**例:**
```
https://sns-decision-making.vercel.app
```

**注意**: 
- `http://`ではなく`https://`を使用
- 末尾にスラッシュ（`/`）は不要

---

### 4. GEMINI_API_KEY

**説明**: Google Gemini APIのキー

**取得方法:**
1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでログイン
3. 「Get API key」をクリック
4. 新しいAPIキーを作成
5. 生成されたキーをコピー

**形式:**
```
AIza...
```

**例:**
```
AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
```

**重要**: 
- APIキーは秘密情報です。GitHubにコミットしないでください
- 「Generative Language API」へのアクセス権限が必要です

---

## メール送信用環境変数（パスワードリセット機能）

### 5. SMTP_HOST

**説明**: SMTPサーバーのホスト名

**Gmail使用時:**
```
smtp.gmail.com
```

**その他のメールサービス:**
- Outlook: `smtp-mail.outlook.com`
- Yahoo: `smtp.mail.yahoo.com`
- カスタムSMTP: メールサービス提供者に確認

---

### 6. SMTP_PORT

**説明**: SMTPサーバーのポート番号

**一般的な値:**
- TLS/STARTTLS: `587`（推奨）
- SSL: `465`

**Gmail使用時:**
```
587
```

---

### 7. SMTP_USER

**説明**: SMTP認証用のメールアドレス

**形式:**
```
your-email@gmail.com
```

**例:**
```
example@gmail.com
```

---

### 8. SMTP_PASSWORD

**説明**: SMTP認証用のパスワード

**Gmail使用時:**
- 通常のパスワードではなく、**アプリパスワード**を使用する必要があります

**Gmailアプリパスワードの取得方法:**
1. Googleアカウントの設定を開く
2. 「セキュリティ」を選択
3. 「2段階認証プロセス」が有効になっていることを確認
4. 「アプリパスワード」を選択
5. 「アプリを選択」→「メール」
6. 「デバイスを選択」→「その他（カスタム名）」→「Vercel」など
7. 「生成」をクリック
8. 16文字のパスワードをコピー

**形式:**
```
16文字の英数字（例: abcd efgh ijkl mnop）
```

**注意**: スペースは含めずに、16文字をそのまま使用

---

### 9. SMTP_FROM

**説明**: 送信元メールアドレス（通常はSMTP_USERと同じ）

**形式:**
```
your-email@gmail.com
```

**例:**
```
example@gmail.com
```

---

## Vercelでの設定手順

### ステップ1: 環境変数を追加

1. Vercelダッシュボードでプロジェクトを選択
2. **Settings** タブをクリック
3. 左メニューから **Environment Variables** を選択
4. 各環境変数を追加：

   **追加ボタンをクリック → 以下を入力:**

   | 変数名 | 値 | 環境 |
   |--------|-----|------|
   | `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
   | `NEXTAUTH_SECRET` | `生成したランダム文字列` | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production, Preview, Development |
   | `GEMINI_API_KEY` | `AIza...` | Production, Preview, Development |
   | `SMTP_HOST` | `smtp.gmail.com` | Production, Preview, Development |
   | `SMTP_PORT` | `587` | Production, Preview, Development |
   | `SMTP_USER` | `your-email@gmail.com` | Production, Preview, Development |
   | `SMTP_PASSWORD` | `アプリパスワード` | Production, Preview, Development |
   | `SMTP_FROM` | `your-email@gmail.com` | Production, Preview, Development |

5. **環境の選択**: 各変数について、**Production**、**Preview**、**Development**すべてにチェックを入れることを推奨

### ステップ2: 設定の確認

すべての環境変数を追加したら、以下を確認：

- [ ] すべての必須環境変数が設定されている
- [ ] `DATABASE_URL`のパスワードが正しく置き換えられている
- [ ] `NEXTAUTH_SECRET`が強力なランダム文字列である
- [ ] `NEXTAUTH_URL`が正しい形式（`https://`で始まる）である
- [ ] `GEMINI_API_KEY`が正しい形式（`AIza`で始まる）である
- [ ] `SMTP_PASSWORD`がGmailアプリパスワードである（通常のパスワードではない）

### ステップ3: デプロイ後の確認

デプロイ後、以下を確認：

1. **NEXTAUTH_URLの更新**
   - デプロイ後に実際のURLが分かったら、`NEXTAUTH_URL`を更新
   - 例: `https://sns-decision-making-xxxxx.vercel.app`
   - 更新後、再デプロイが必要な場合があります

2. **動作確認**
   - アプリケーションが正常に起動するか
   - ログイン機能が動作するか
   - 分析機能が動作するか

---

## トラブルシューティング

### エラー: "DATABASE_URL is not set"
- 環境変数が正しく設定されているか確認
- Production、Preview、Developmentすべてに設定されているか確認

### エラー: "NEXTAUTH_SECRET is not set"
- 環境変数が設定されているか確認
- 強力なランダム文字列であることを確認

### エラー: "Invalid API key"
- `GEMINI_API_KEY`が正しい形式か確認（`AIza`で始まる）
- APIキーに「Generative Language API」へのアクセス権限があるか確認

### メール送信エラー
- `SMTP_PASSWORD`がGmailアプリパスワードであることを確認
- 2段階認証が有効になっていることを確認
- `SMTP_PORT`が`587`であることを確認

---

## セキュリティ注意事項

⚠️ **重要**: 
- 環境変数は秘密情報です。GitHubにコミットしないでください
- `.env.local`ファイルは`.gitignore`に含まれています
- Vercelの環境変数は暗号化されて保存されます
- 本番環境と開発環境で異なる値を使用することを推奨

---

## クイックチェックリスト

デプロイ前に以下を確認：

- [ ] `DATABASE_URL` - Supabaseから取得、パスワードを置き換え
- [ ] `NEXTAUTH_SECRET` - `openssl rand -base64 32`で生成
- [ ] `NEXTAUTH_URL` - デプロイ後のURL（最初は仮のURLでOK）
- [ ] `GEMINI_API_KEY` - Google AI Studioから取得
- [ ] `SMTP_HOST` - `smtp.gmail.com`
- [ ] `SMTP_PORT` - `587`
- [ ] `SMTP_USER` - Gmailアドレス
- [ ] `SMTP_PASSWORD` - Gmailアプリパスワード（16文字）
- [ ] `SMTP_FROM` - Gmailアドレス（通常はSMTP_USERと同じ）

すべて設定できたら、デプロイを実行してください！

