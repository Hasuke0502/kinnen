# Supabase Edge Functions 自動化セットアップガイド

## 🎯 概要

Supabase Edge Functionsを使用して、30日間チャレンジ完了時の自動返金処理を実装するための完全なセットアップガイドです。

## 📋 実装内容

### ✅ 自動化される処理
1. **チャレンジ完了判定** - 30日経過したチャレンジの検出
2. **ステータス更新** - `active` → `completed` への変更
3. **返金処理** - Stripe API経由での自動返金
4. **データベース更新** - 返金完了状態の記録
5. **エラーハンドリング** - 失敗時の適切な処理

### 🕒 実行スケジュール
- **毎日午前9時（JST）** に自動実行
- UTC午前0時にcron jobが起動

## 🛠️ セットアップ手順

### ステップ1: Supabase CLIのインストール

```bash
# NPMでインストール
npm install -g supabase

# またはHomebrewでインストール（Mac）
brew install supabase/tap/supabase

# バージョン確認
supabase --version
```

### ステップ2: Supabaseプロジェクトとの連携

```bash
# プロジェクトルートで実行
cd my-app

# Supabaseプロジェクトとリンク
supabase link --project-ref YOUR_PROJECT_ID

# YOUR_PROJECT_IDは以下で確認:
# Supabase Dashboard > Settings > General > Reference ID
```

### ステップ3: データベースマイグレーション

```bash
# 返金関連カラムの追加
supabase sql --file sql/migration_refund_columns.sql
```

または、Supabase Dashboardで直接実行：
```sql
-- sql/migration_refund_columns.sql の内容をコピー&ペースト
```

### ステップ4: Edge Functionのデプロイ

```bash
# Edge Functionをデプロイ
supabase functions deploy process-completed-challenges

# デプロイ成功の確認
supabase functions list
```

### ステップ5: 環境変数の設定

Supabase Dashboard > Edge Functions > process-completed-challenges > Settings で以下を設定：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

**重要**: 本番環境では `sk_live_` プレフィックスの本番用Stripeキーを使用してください。

### ステップ6: cron jobの設定

Supabase Dashboard > Database > SQL Editor で以下を実行：

```sql
-- pg_cron拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 毎日午前9時（JST）に実行するジョブを設定
SELECT cron.schedule(
  'process-completed-challenges',
  '0 0 * * *', -- 毎日UTC午前0時（JST午前9時）
  $$ 
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-completed-challenges',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);
```

**注意**: 
- `YOUR_PROJECT` を実際のSupabaseプロジェクトIDに置き換え
- `YOUR_SERVICE_ROLE_KEY` を実際のサービスロールキーに置き換え

## 🧪 テスト実行

### 手動テスト

Edge Functionを手動で実行してテスト：

```bash
# Supabase CLIからテスト実行
supabase functions invoke process-completed-challenges \
  --env-file supabase/functions/process-completed-challenges/.env.local
```

### ブラウザからテスト

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-completed-challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 期待されるレスポンス

```json
{
  "success": true,
  "message": "Challenge processing completed",
  "summary": {
    "processed_count": 2,
    "refunded_count": 1,
    "error_count": 0
  }
}
```

## 📊 監視とログ

### ログの確認

**Supabase Dashboard** > **Edge Functions** > **process-completed-challenges** > **Logs**

### cron jobの実行状況確認

```sql
-- ジョブの確認
SELECT * FROM cron.job WHERE jobname = 'process-completed-challenges';

-- 実行履歴の確認（直近10回）
SELECT * FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'process-completed-challenges'
) 
ORDER BY start_time DESC LIMIT 10;
```

### 実行結果の確認

```sql
-- 完了したチャレンジの確認
SELECT 
  id,
  user_id,
  status,
  total_success_days,
  refund_completed,
  refund_amount,
  refund_completed_at
FROM challenges 
WHERE status = 'completed' 
ORDER BY updated_at DESC;
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

#### 1. Edge Functionデプロイエラー

```bash
# エラー詳細を確認
supabase functions deploy process-completed-challenges --debug

# プロジェクトリンクを再確認
supabase projects list
supabase link --project-ref YOUR_PROJECT_ID
```

#### 2. 環境変数が読み込まれない

- Supabase Dashboard > Edge Functions > Settings で設定を確認
- 変数名にタイポがないか確認
- 保存後、Functionを再デプロイ

#### 3. cron jobが実行されない

```sql
-- pg_cron拡張機能の確認
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ジョブが正しく作成されているか確認
SELECT * FROM cron.job;

-- 手動でジョブを実行してテスト
SELECT cron.run_job('process-completed-challenges');
```

#### 4. Stripe返金エラー

- Stripe Dashboard > Developers > Logs でエラー詳細を確認
- API キーが正しく設定されているか確認
- payment_intent_idが有効か確認

```sql
-- 返金対象チャレンジの確認
SELECT 
  c.id,
  c.payment_intent_id,
  c.payment_completed,
  up.payout_method,
  up.participation_fee
FROM challenges c
JOIN user_profiles up ON c.user_id = up.user_id
WHERE c.status = 'completed' 
  AND up.payout_method = 'refund'
  AND c.refund_completed = false;
```

## 📈 パフォーマンス最適化

### バッチ処理の調整

大量のチャレンジを処理する場合、Edge Function内でバッチサイズを調整：

```typescript
// 一度に処理するチャレンジ数を制限
const BATCH_SIZE = 50;
const challenges = expiredChallenges.slice(0, BATCH_SIZE);
```

### リトライ機能の追加

失敗したケースのリトライロジック追加を検討。

## 🔒 セキュリティ考慮事項

1. **サービスロールキーの管理**
   - 環境変数としてSecure Storage に保存
   - 定期的なキーローテーション

2. **Stripe API キーの管理**
   - 本番用とテスト用の適切な分離
   - 最小権限の原則

3. **ログの機密情報**
   - 個人情報をログに出力しない
   - エラー詳細は適切にマスク

## 🎯 運用開始チェックリスト

- [ ] データベースマイグレーション完了
- [ ] Edge Function デプロイ完了
- [ ] 環境変数設定完了
- [ ] cron job 設定完了
- [ ] 手動テスト実行成功
- [ ] ログ監視体制構築
- [ ] エラー通知設定
- [ ] 本番環境Stripe API キー設定

## 📞 サポート情報

### 関連リンク
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Stripe Refunds API](https://stripe.com/docs/api/refunds)

### ログ保存場所
- Edge Function ログ: Supabase Dashboard > Functions
- cron job ログ: `cron.job_run_details` テーブル
- アプリケーションログ: Vercel/Next.js ログ

これで Supabase Edge Functions による自動化が完全にセットアップされます！🎉 