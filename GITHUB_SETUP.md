# GitHub連携手順

## 1. GitHubでリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」ボタンをクリック → 「New repository」を選択
3. リポジトリ情報を入力：
   - **Repository name**: `sns-analyzer`（または任意の名前）
   - **Description**: `SNS投稿 意思決定ツール`
   - **Visibility**: Private（推奨）または Public
   - **Initialize this repository with**: チェックを外す（既存のリポジトリをプッシュするため）
4. 「Create repository」をクリック

## 2. リモートリポジトリを追加してプッシュ

ターミナルで以下のコマンドを実行してください：

```bash
# リモートリポジトリを追加
# <your-username> と <repository-name> を実際の値に置き換えてください
git remote add origin https://github.com/<your-username>/<repository-name>.git

# 現在のブランチを確認
git branch

# すべてのファイルをステージング
git add .

# コミット（まだコミットしていない場合）
git commit -m "Initial commit: SNS投稿 意思決定ツール"

# GitHubにプッシュ
git push -u origin main
```

## 3. 認証について

初めてプッシュする場合、GitHubの認証が必要です：

### Personal Access Token（推奨）

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token (classic)」をクリック
3. 以下の権限を選択：
   - `repo` (Full control of private repositories)
4. トークンを生成してコピー
5. プッシュ時にパスワードの代わりにトークンを入力

### SSH認証（オプション）

SSHキーを使用する場合：

```bash
# SSHキーを生成（まだ持っていない場合）
ssh-keygen -t ed25519 -C "your-email@example.com"

# SSHキーをGitHubに追加
# ~/.ssh/id_ed25519.pub の内容をコピーして
# GitHub → Settings → SSH and GPG keys → New SSH key に追加

# リモートURLをSSHに変更
git remote set-url origin git@github.com:<your-username>/<repository-name>.git
```

## 4. 確認

プッシュ後、GitHubのリポジトリページでファイルが表示されることを確認してください。

## トラブルシューティング

### エラー: "remote origin already exists"
既にリモートが設定されている場合：
```bash
git remote remove origin
git remote add origin https://github.com/<your-username>/<repository-name>.git
```

### エラー: "failed to push some refs"
リモートに既にファイルがある場合：
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

