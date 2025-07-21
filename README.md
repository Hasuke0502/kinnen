# 禁煙30日チャレンジアプリ 🚭

マネーモンスターを倒して禁煙を成功させる、ゲーム性のある禁煙支援アプリケーションです。

## 🎯 アプリの特徴

- **ゲーム要素**: マネーモンスターとの戦いを通じて禁煙を楽しく継続
- **柔軟な記録システム**: 禁煙の有無に関わらず、記録すれば成功日としてカウント
- **選択できるリターン**: 返金または慈善団体への募金を選択可能
- **安全な決済**: Stripeを使用した安全な決済システム
- **プログレス管理**: 視覚的な進捗トラッキングとカレンダー表示

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript
- **認証・データベース**: Supabase (PostgreSQL, Auth, Real-time)
- **決済**: Stripe
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel（推奨）

## 🚀 セットアップ

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd my-app
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルをプロジェクトルートに作成し、以下の環境変数を設定してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe設定（決済機能）
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Supabaseの設定

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. Project Settings > APIからURLとAnon keyを取得
3. SQL Editorで `sql/create_tables.sql` のクエリを実行してテーブルを作成

#### Stripeの設定

1. [Stripe](https://stripe.com)でアカウントを作成
2. Developers > API keysからSecret keyとPublishable keyを取得
3. Developers > WebhooksでWebhookエンドポイントを設定:
   - エンドポイントURL: `https://your-domain.com/api/webhook/stripe`
   - イベント: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Webhook signing secretを取得

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてアプリケーションを確認。

## 💰 決済フローの仕組み

### 参加費の設定と支払い

1. **オンボーディング**: ユーザーが喫煙状況と参加費を設定
2. **決済ページ**: Stripe Elementsを使用した安全な決済フォーム
3. **チャレンジ開始**: 決済完了後、30日間のチャレンジが開始

### 返金・募金の計算

#### 返金を選択した場合
- **計算式**: `(参加費 - 500円) × (記録成功日数 ÷ 30日)`
- **手数料**: 返金処理手数料として500円
- **例**: 参加費10,000円、20日記録成功 → 6,333円が返金

#### 募金を選択した場合
- **計算式**: `参加費 × (記録成功日数 ÷ 30日)`
- **手数料**: なし（参加費の全額が対象）
- **例**: 参加費10,000円、20日記録成功 → 6,667円を募金

### 0円参加

- 参加費0円でもチャレンジに参加可能
- 金銭的なリターンはなし
- ゲーム要素と達成感は同様に楽しめます

## 🎮 ゲームシステム

### マネーモンスター

- 参加費がマネーモンスターの「体力」として表示
- 毎日の記録でダメージを与える
- 記録を続けることで徐々にお金を「取り戻す」演出

### 記録ルール

- **重要**: 禁煙できた日も、吸ってしまった日も、記録すれば成功日としてカウント
- 記録しなかった日のみカウントされない
- 正直な記録を促しつつ、継続を重視

## 📱 主要機能

- ✅ ユーザー認証（メール・パスワード）
- ✅ オンボーディング（喫煙状況・参加費・リターン方法の設定）
- ✅ Stripe決済システム（参加費徴収・返金処理）
- ✅ 毎日の記録機能
- ✅ マネーモンスターのビジュアル表示
- ✅ 進捗トラッキング（カレンダー・統計）
- ✅ プッシュ通知設定
- ✅ 募金証明機能
- ✅ 音響効果

## 🔧 開発情報

### ディレクトリ構造

```
app/
├── api/
│   ├── create-payment-intent/  # Stripe Payment Intent作成
│   └── webhook/stripe/         # Stripe Webhook処理
├── auth/                       # 認証関連ページ
├── dashboard/                  # メインダッシュボード
├── onboarding/                 # 初期設定
├── payment/                    # 決済ページ
└── ...

components/
├── PaymentForm.tsx            # Stripe決済フォーム
├── MoneyMonster.tsx           # ゲーム要素
└── ...

lib/
├── stripe.ts                  # Stripe関連ユーティリティ
└── ...
```

### ベストプラクティス

- Next.js App Routerのベストプラクティスに準拠
- Server ComponentsとClient Componentsの適切な使い分け
- Supabaseの認証システムとの連携
- Stripe決済の安全な実装

## 🚀 デプロイ

### Vercelへのデプロイ（推奨）

1. [Vercel](https://vercel.com)でアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定（本番用のSupabaseとStripeキー）
4. デプロイ

### 本番環境の設定

本番環境では以下の点に注意：

- Stripeの本番キー（`pk_live_...`, `sk_live_...`）を使用
- SupabaseのRow Level Security (RLS) を有効化
- WebhookエンドポイントのURLを本番ドメインに変更
- CORS設定の確認

## 📋 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

バグ報告や機能改善の提案は、GitHubのIssuesでお知らせください。
