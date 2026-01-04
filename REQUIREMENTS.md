# SNS投稿 意思決定ツール 要件定義書

## 1. プロジェクト概要

### 1.1 プロジェクト名
**SNS投稿 意思決定ツール**

### 1.2 目的
AIを活用してSNS投稿を定性・定量分析し、投稿前後の意思決定（GO/HOLD/NO-GO）をサポートするB2B向けWebアプリケーション。

### 1.3 ターゲットユーザー
- 企業のSNSマーケティング担当者
- 広報・ブランド担当者
- コンテンツ制作者
- マーケティングマネージャー

### 1.4 主要な価値提案
- **意思決定の完結**: 投稿を出す/出さない/修正するという意思決定を明確にサポート
- **社内説明に使える分析**: 上長・役員、広報、制作者それぞれに向けた説明文を自動生成
- **投稿前後の両方に対応**: 投稿前の分析と投稿後の実績分析の両方をサポート
- **ブランドセーフティ評価**: ブランドリスクを多角的に評価

---

## 2. 機能要件

### 2.1 認証機能

#### 2.1.1 ユーザー登録
- **機能**: メールアドレスとパスワードによる新規アカウント作成
- **必須項目**: 
  - メールアドレス（一意制約）
  - パスワード（6文字以上）
- **オプション項目**: 
  - 名前
- **処理フロー**:
  1. フォーム入力
  2. メールアドレスの重複チェック
  3. パスワードのハッシュ化（bcryptjs）
  4. データベースに保存
  5. ウェルカムメール送信（オプション）
  6. ログインページへリダイレクト

#### 2.1.2 ログイン
- **機能**: メールアドレスとパスワードによる認証
- **認証方式**: NextAuth.js v5（Credentials Provider）
- **セッション管理**: JWTベースのセッション
- **リダイレクト**: 未ログイン時は自動的にログインページへ

#### 2.1.3 パスワードリセット
- **機能**: パスワード忘れ時のリセット機能
- **処理フロー**:
  1. メールアドレス入力
  2. リセットトークン生成（有効期限付き）
  3. リセットメール送信
  4. メール内のリンクからパスワード再設定
  5. トークン検証後、新パスワード設定

### 2.2 投稿分析機能

#### 2.2.1 分析タイプ
- **投稿前分析（pre）**: まだ投稿されていない投稿内容の分析
- **投稿後分析（post）**: 既に投稿された投稿の実績データを基にした分析

#### 2.2.2 入力項目

**基本情報**:
- 投稿テキスト（必須）
- プラットフォーム選択: Facebook / X / Instagram
- プラットフォームタイプ（Instagramの場合）: フィード / リール / ストーリーズ

**メディア**:
- 画像アップロード（オプション）
  - 最大サイズ: 20MB
  - 対応形式: 画像ファイル全般
  - Base64エンコードで保存
- 動画アップロード（オプション）
  - 最大サイズ: 100MB
  - 対応形式: 動画ファイル全般
  - Base64エンコードで保存

**定量データ（投稿後分析の場合）**:
- インプレッション数
- リーチ数
- いいね数
- コメント数
- シェア数
- 保存数（Instagram）
- エンゲージメント率

#### 2.2.3 分析結果の構成

**1. 定性分析（Qualitative Analysis）**
- 投稿の要約（100文字程度）
- トーン: ポジティブ / ネガティブ / 中立
- ターゲットオーディエンス
- メッセージの明確さ
- 感情的な訴求力
- ブランドボイスの一貫性

**2. 定量分析（Quantitative Analysis）**
- パフォーマンスの総合評価
- エンゲージメント分析
- リーチ・インプレッション分析
- 業界平均や過去投稿との比較（可能な場合）

**3. 改善提案（Improvement Suggestions）**
- コンテンツ改善案（複数）
- 投稿タイミングの提案
- ハッシュタグ提案（複数）
- 画像・動画に関する提案
- 次回投稿の推奨事項（複数）

**4. 意思決定結果（Decision Result）**
- 判定: **GO** / **HOLD** / **NO-GO**
- 理由: 社内説明にそのまま使える文章

**5. ブランドセーフティ評価（Brand Safety Evaluation）**
- ブランドトーンの不一致リスク: 低 / 中 / 高
- 誤解リスク: 低 / 中 / 高
- プラットフォームコンテキストの不一致リスク: 低 / 中 / 高
- KPIトレードオフリスク: 低 / 中 / 高
- 全体の注意点

**6. 却下理由（Rejection Reasons）**（HOLD/NO-GOの場合のみ）
- 上長・役員向け: 論理重視、データや戦略的観点
- 広報・ブランド担当向け: トーン重視、ブランドイメージやリスク管理
- 制作者向け: 改善指示、具体的な修正ポイント

**7. 判断ログ（Decision Log）**
- AIの示唆
- 最終判断
- 判断理由
- 次に見るべきKPI（複数）
- 判断の再評価タイミング

**8. 次アクション指示（Next Action）**
- 次に行うべきアクション
- 成功・失敗を判断するための具体KPI（複数）
- いつ・誰が確認すべきか

**9. 投稿案（Post Proposal）**（GO/HOLDの場合のみ）
- テキスト案（3つ程度、異なるアプローチ）
- クリエイティブ提案:
  - タイプ: image / video
  - 画像生成用プロンプト（英語、詳細）
  - 動画構成イメージ（シーンごとの構成、カット割りなど）
  - クリエイティブの説明（日本語）

### 2.3 履歴管理機能

#### 2.3.1 分析履歴の表示
- **表示モード**: シンプル表示（固定）
- **表示項目**:
  - 分析日時
  - プラットフォーム
  - 投稿テキスト（3-4文字短縮表示、途中で切って...表示）
  - 画像/動画のサムネイル（存在する場合、チェックボックス左隣に小さく表示）
  - チェックボックス（カード右端の中央）

**レイアウト**:
- カードの高さ: 固定（`h-24`）
- テキストエリアの右パディング: `pr-28`（チェックボックスとサムネイルのスペース確保）
- 日時・プラットフォームセクションの幅: `w-44`（テキスト重複防止）
- 投稿前・投稿後でセクション分け
- 各セクション最大6件表示、それ以降はスクロール（`max-h-[616px] overflow-y-auto`）

#### 2.3.2 詳細表示（モーダル）
- カードをタップするとモーダルで詳細表示
- モーダル内はスクロール可能
- 分析結果の全項目を表示
- 中立・ポジティブ・数値などの詳細情報もタップで表示可能

#### 2.3.3 履歴の選択とエクスポート
- チェックボックスで複数選択可能
- 選択した履歴をPDFとしてエクスポート
- PDF生成ライブラリ: jsPDF + html2canvas

### 2.4 データ保存機能
- 分析結果をデータベースに自動保存
- ユーザーごとに履歴を管理
- 画像・動画もBase64形式で保存

---

## 3. 非機能要件

### 3.1 パフォーマンス
- 画像アップロード上限: 20MB
- 動画アップロード上限: 100MB
- Server ActionsのbodySizeLimit: 200MB（Base64エンコードを考慮）

### 3.2 セキュリティ
- パスワードのハッシュ化（bcryptjs、salt rounds: 10）
- セッション管理（NextAuth.js）
- 環境変数による機密情報の管理
- SQLインジェクション対策（Prisma ORM）

### 3.3 可用性
- エラーハンドリングの実装
- データベース接続エラーの適切な処理
- ユーザーフレンドリーなエラーメッセージ

### 3.4 UI/UX
- レスポンシブデザイン
- ローディング状態の表示
- エラーメッセージの明確な表示
- モーダルのスクロール対応

---

## 4. 技術スタック

### 4.1 フロントエンド
- **フレームワーク**: Next.js 16.1.1（App Router）
- **UIライブラリ**: React 19.2.3
- **スタイリング**: Tailwind CSS 4
- **フォント**: Geist Sans, Geist Mono

### 4.2 バックエンド
- **ランタイム**: Node.js
- **フレームワーク**: Next.js（Server Actions）
- **認証**: NextAuth.js v5.0.0-beta.30
- **ORM**: Prisma 6.0.0

### 4.3 データベース
- **本番環境**: PostgreSQL（Vercel Postgres / Supabase）
- **開発環境**: SQLite（`prisma/dev.db`）
- **マイグレーション**: Prisma Migrate

### 4.4 AI/ML
- **AI API**: Google Gemini API（@google/generative-ai 0.24.1）
- **使用モデル**: 
  - gemini-2.5-flash（優先）
  - gemini-2.5-pro
  - gemini-1.5-flash
  - gemini-1.5-pro
  - gemini-1.0-pro
  - gemini-pro（フォールバック）

### 4.5 その他ライブラリ
- **PDF生成**: jsPDF 3.0.4, html2canvas 1.4.1
- **HTML解析**: cheerio 1.1.2
- **メール送信**: nodemailer 6.9.9
- **パスワードハッシュ**: bcryptjs 3.0.3

### 4.6 開発ツール
- **言語**: TypeScript 5
- **リンター**: ESLint 9
- **パッケージマネージャー**: npm

### 4.7 デプロイメント
- **ホスティング**: Vercel
- **CI/CD**: Vercel自動デプロイ（GitHub連携）

---

## 5. データベース設計

### 5.1 テーブル構成

#### 5.1.1 User（ユーザー）
```prisma
model User {
  id                String      @id @default(cuid())
  email             String      @unique
  name              String?
  password          String
  subscriptionPlan  String      @default("free") // "free" or "premium"
  subscriptionExpiresAt DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  analyses          Analysis[]
  passwordResetTokens PasswordResetToken[]

  @@map("user")
}
```

#### 5.1.2 Analysis（分析履歴）
```prisma
model Analysis {
  id                String      @id @default(cuid())
  userId            String
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform          String?
  platformType      String?
  postText          String
  imageBase64       String?
  imageMimeType     String?
  videoBase64       String?
  videoMimeType     String?
  impressions       Int?
  reach             Int?
  likes             Int?
  comments          Int?
  shares            Int?
  saves             Int?
  engagementRate    Float?
  result            String // JSON string of AnalyzePostResult
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([userId])
  @@index([createdAt])
  @@map("analysis")
}
```

#### 5.1.3 PasswordResetToken（パスワードリセットトークン）
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("password_reset_token")
}
```

### 5.2 インデックス
- `User.email`: ユニークインデックス
- `Analysis.userId`: ユーザーごとの検索高速化
- `Analysis.createdAt`: 日時順ソート高速化
- `PasswordResetToken.token`: トークン検索高速化
- `PasswordResetToken.userId`: ユーザーごとの検索
- `PasswordResetToken.expiresAt`: 有効期限チェック高速化

### 5.3 外部キー制約
- `Analysis.userId` → `User.id` (CASCADE DELETE)
- `PasswordResetToken.userId` → `User.id` (CASCADE DELETE)

---

## 6. API統合

### 6.1 Google Gemini API
- **用途**: SNS投稿の分析と意思決定支援
- **認証**: APIキー（環境変数 `GEMINI_API_KEY`）
- **エンドポイント**: Google Generative AI SDK経由
- **エラーハンドリング**: 
  - 複数モデルのフォールバック
  - APIキー検証
  - 詳細なエラーメッセージ

### 6.2 メール送信（SMTP）
- **用途**: ウェルカムメール、パスワードリセットメール
- **ライブラリ**: nodemailer
- **設定**: 環境変数でSMTP設定

---

## 7. 環境変数

### 7.1 必須環境変数

```env
# データベース
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Google Gemini API
GEMINI_API_KEY="AIza..."

# SMTP設定（メール送信）
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@example.com"
```

### 7.2 開発環境
- `.env.local`ファイルに設定
- Gitにコミットしない（`.gitignore`に追加）

### 7.3 本番環境（Vercel）
- Vercelダッシュボードの環境変数設定で管理
- ビルド時・ランタイム時に利用可能

---

## 8. デプロイメント要件

### 8.1 Vercelデプロイメント
- **ビルドコマンド**: `npm run build`
- **ビルドプロセス**:
  1. `prisma generate`（Prisma Client生成）
  2. `node scripts/migrate.js`（本番環境でのみマイグレーション実行）
  3. `next build`（Next.jsビルド）

### 8.2 データベースマイグレーション
- **開発環境**: `prisma db push`（スキーマを直接適用）
- **本番環境**: `prisma migrate deploy`（マイグレーションファイルを適用）
- **マイグレーション実行タイミング**: ビルド時（本番環境のみ）

### 8.3 データベースオプション
- **Vercel Postgres**: Vercel統合データベース
- **Supabase**: 外部PostgreSQLサービス（代替案）

---

## 9. UI/UX要件

### 9.1 デザインシステム
- **カラースキーム**: ダークテーマ（glassmorphism）
- **カードデザイン**: ガラスモーフィズム効果
- **タイポグラフィ**: Geist Sans（本文）、Geist Mono（コード）

### 9.2 レスポンシブデザイン
- モバイルファーストアプローチ
- タブレット・デスクトップ対応

### 9.3 アクセシビリティ
- キーボードナビゲーション対応
- 適切なコントラスト比
- エラーメッセージの明確な表示

### 9.4 ローディング状態
- 分析処理中のローディング表示
- PDF生成中のローディング表示
- フォーム送信中のローディング表示

---

## 10. ファイル構成

```
sns-analyzer/
├── app/
│   ├── actions.ts              # Server Actions（分析、登録、認証など）
│   ├── page.tsx                # メインページ（分析画面）
│   ├── history/
│   │   └── page.tsx            # 履歴ページ
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx        # ログインページ
│   │   ├── signup/
│   │   │   └── page.tsx        # 登録ページ
│   │   ├── forgot-password/
│   │   │   └── page.tsx        # パスワード忘れページ
│   │   └── reset-password/
│   │       └── page.tsx        # パスワードリセットページ
│   ├── api/
│   │   └── analysis/
│   │       └── history/
│   │           └── route.ts     # 履歴取得API
│   ├── layout.tsx              # ルートレイアウト
│   ├── providers.tsx            # NextAuth Provider
│   └── globals.css             # グローバルスタイル
├── lib/
│   ├── prisma.ts               # Prisma Client設定
│   └── email.ts                 # メール送信機能
├── prisma/
│   ├── schema.prisma           # Prismaスキーマ
│   └── migrations/             # マイグレーションファイル
├── scripts/
│   └── migrate.js              # マイグレーション実行スクリプト
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.local                   # 環境変数（開発用）
```

---

## 11. 用語集

### 11.1 分析タイプ
- **投稿前（pre）**: まだ投稿されていない投稿内容の分析
- **投稿後（post）**: 既に投稿された投稿の実績データを基にした分析

### 11.2 意思決定結果
- **GO**: このまま投稿して良い
- **HOLD**: 修正が必要、修正後に再検討
- **NO-GO**: この投稿は採用しない

### 11.3 プラットフォーム
- **Facebook**: Facebook
- **X**: X（旧Twitter）
- **Instagram**: Instagram（フィード/リール/ストーリーズ）

### 11.4 ジャンル
- 投稿のテキストやクリエイティブの系統を指す（以前は「系統」という表現を使用していたが、「ジャンル」に変更）

---

## 12. 今後の拡張予定

### 12.1 サブスクリプション機能
- フリープランとプレミアムプランの区別
- `User.subscriptionPlan`フィールドは実装済み（未使用）

### 12.2 機能拡張の可能性
- チーム機能（複数ユーザーでの共有）
- 分析結果のエクスポート機能の拡張（CSV、Excelなど）
- カスタム分析プロンプトの設定
- 分析結果の比較機能

---

## 13. 制約事項

### 13.1 技術的制約
- 画像・動画はBase64形式で保存（データベースサイズの増加に注意）
- Server ActionsのbodySizeLimit: 200MB
- Gemini APIのレート制限に依存

### 13.2 ビジネス制約
- 現在はフリープランのみ（サブスクリプション機能は未実装）

---

## 14. 変更履歴

### v0.1.0（2025年1月）
- 初回リリース
- 基本的な分析機能
- 認証機能
- 履歴管理機能
- Vercelデプロイ対応

---

## 15. 参考資料

### 15.1 ドキュメント
- `DEPLOYMENT.md`: デプロイメント手順
- `GITHUB_SETUP.md`: GitHubリポジトリ設定
- `VERCEL_DEPLOY.md`: Vercelデプロイ詳細
- `VERCEL_BUILD_FIX.md`: ビルドエラー対処法
- `VERCEL_ENV_VARIABLES.md`: 環境変数設定ガイド

### 15.2 外部リンク
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Gemini API](https://ai.google.dev/)

---

**最終更新日**: 2025年1月1日
**バージョン**: 1.0.0

