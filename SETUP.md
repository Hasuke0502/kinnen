# 禁煙30日チャレンジアプリ セットアップガイド

## 必要な環境

- Node.js 18以上
- npm または yarn
- Supabaseアカウント
- Stripeアカウント（本番環境の場合）

## 1. プロジェクトのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd my-app
npm install
```

## 2. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成し、必要な値を設定してください。

```bash
cp .env.example .env.local
```

### Supabase設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. Project Settings > APIからURLとAnon keyを取得
3. `.env.local`に設定

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Stripe設定（決済機能を使用する場合）

1. [Stripe](https://stripe.com)でアカウントを作成
2. Developers > API keysからSecret keyとPublishable keyを取得
3. Webhookエンドポイントを設定してWebhook secretを取得
4. `.env.local`に設定

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## 3. データベースのセットアップ

Supabase SQL EditorでSQLファイルを実行してテーブルを作成：

```sql
-- sql/create_tables.sqlの内容をコピー&ペーストして実行
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてアプリケーションを確認。

## 5. デプロイ（本番環境）

### Vercelへのデプロイ（推奨）

1. [Vercel](https://vercel.com)でアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイ

### 環境変数の本番設定

本番環境では以下の環境変数を適切に設定してください：

- `NEXT_PUBLIC_SUPABASE_URL`: 本番Supabaseプロジェクトのurl
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 本番環境のAnon key
- `STRIPE_SECRET_KEY`: 本番Stripeの秘密鍵
- `STRIPE_WEBHOOK_SECRET`: 本番Webhookの秘密鍵
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: 本番Stripeの公開鍵
- `NEXT_PUBLIC_APP_URL`: 本番アプリケーションのURL

## 機能概要

このアプリケーションには以下の機能が実装されています：

- ✅ ユーザー認証（メール・パスワード）
- ✅ オンボーディング（喫煙状況設定、参加費設定、返金・募金選択）
- ✅ 毎日の記録機能（記録すれば禁煙の有無に関わらず成功日としてカウント）
- ✅ マネーモンスターのゲーム要素
- ✅ 進捗トラッキング（カレンダー表示、統計）
- ✅ Stripe決済システム（参加費徴収、返金処理）
- ✅ 募金証明機能
- ✅ プッシュ通知設定
- ✅ ダッシュボード
- ✅ 設定ページ

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript
- **バックエンド**: Supabase (PostgreSQL, Auth, Real-time)
- **決済**: Stripe
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel（推奨）

## サポート

技術的な問題やバグ報告については、GitHubのIssuesでお知らせください。 