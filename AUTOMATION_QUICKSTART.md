# 🚀 自動化 クイックスタートガイド

## 概要
30日間チャレンジ完了時の自動返金処理を、Supabase Edge Functionsで実装します。

## ⚡ Supabase CLI による簡単セットアップ

### 前提条件 ✅
- ✅ Scoopインストール済み
- ✅ Supabaseプロジェクト作成済み
- ✅ Stripeアカウント設定済み

---

## 🚀 5ステップでの自動化セットアップ

### ステップ1: Supabase CLI インストール

```bash
# Scoopでインストール
scoop bucket add supabase https://github.com/supabase/scoop-bucket
scoop install supabase

# インストール確認
supabase --version
```

### ステップ2: プロジェクトとの連携

```bash
# プロジェクトルートに移動
cd my-app

# Supabaseプロジェクトとリンク
supabase link --project-ref vezpfnqvvkawrdguwmhv

# YOUR_PROJECT_IDの確認方法:
# Supabase Dashboard > Settings > General > Reference ID
```

### ステップ3: データベースマイグレーション

```bash
# 返金関連カラムを追加
supabase sql --file sql/migration_refund_columns.sql

# 実行確認
echo "✅ マイグレーション完了"
```

### ステップ4: Edge Function デプロイ

```bash
# Edge Functionをデプロイ
supabase functions deploy process-completed-challenges

# デプロイ確認
supabase functions list
```

### ステップ5: 環境変数設定

**Supabase Dashboard** > **Edge Functions** > **process-completed-challenges** > **Settings**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

**📋 取得方法:**
- `SUPABASE_URL`: Dashboard > Settings > API > Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Dashboard > Settings > API > service_role secret  
- `STRIPE_SECRET_KEY`: Stripe Dashboard > Developers > API keys

---

## 🕒 cron job 設定（自動実行）

**Supabase Dashboard** > **Database** > **SQL Editor** で以下を実行：

```sql
-- pg_cron拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 毎日午前9時（JST）に自動実行するジョブを設定
SELECT cron.schedule(
  'process-completed-challenges',
  '0 0 * * *', -- 毎日UTC午前0時（JST午前9時）
  $$ 
  SELECT net.http_post(
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

**⚠️ 注意:** 
- `YOUR_PROJECT` を実際のSupabaseプロジェクトIDに置き換え
- `YOUR_SERVICE_ROLE_KEY` を実際のサービスロールキーに置き換え

---

## 🧪 動作テスト

### 手動テスト実行

```bash
# スクリプトを使用してテスト
./scripts/test-automation.sh

# または直接実行
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-completed-challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 期待される結果

```json
{
  "success": true,
  "message": "Challenge processing completed",
  "summary": {
    "processed_count": 2,
    "refunded_count": 1,
    "donation_count": 1,
    "error_count": 0
  }
}
```

## 🎯 これで完了！

毎日午前9時（JST）に自動で以下が実行されます：

1. ✅ **30日経過チャレンジの検出**
2. ✅ **ステータス更新** (`active` → `completed`)
3. ✅ **返金処理** (Stripe API経由)
4. ✅ **DB更新** (返金完了状態を記録)

## 📊 監視方法

### リアルタイム監視
- **Supabase Dashboard** > **Edge Functions** > **Logs**

### 実行履歴確認
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-completed-challenges')
ORDER BY start_time DESC LIMIT 10;
```

### 返金状況確認
```sql
SELECT 
  id, user_id, status, refund_completed, refund_amount, refund_completed_at
FROM challenges 
WHERE status = 'completed' AND refund_completed = true
ORDER BY refund_completed_at DESC;
```

## 📊 監視とメンテナンス

### ログ確認

```bash
# Edge Function ログ確認
supabase functions logs process-completed-challenges

# cron job 確認
supabase sql --query "SELECT * FROM cron.job WHERE jobname = 'process-completed-challenges';"

# 実行履歴確認
supabase sql --query "SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;"
```

### 動作確認用クエリ

```sql
-- 返金完了チャレンジの確認
SELECT id, user_id, refund_completed, refund_amount, refund_completed_at
FROM challenges 
WHERE refund_completed = true 
ORDER BY refund_completed_at DESC;

-- 処理対象チャレンジの確認
SELECT COUNT(*) as target_challenges
FROM challenges 
WHERE status = 'active' AND end_date <= CURRENT_DATE;
```

---

## 🆘 トラブルシューティング

### よくある問題

#### ❌ CLI関連
- **`supabase link` エラー**: PROJECT_ID が正しいか確認
- **権限エラー**: `.supabase/` フォルダがあるディレクトリで実行

#### ❌ 自動化機能
- **Edge Function エラー**: 環境変数と`index.ts`の内容を確認
- **Stripe返金エラー**: API キーとpayment_intent_idを確認  
- **cron job未実行**: URL・Authorizationトークンを確認

### 🚨 緊急時対応

```bash
# 手動で返金処理実行
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-completed-challenges \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# ログで詳細確認
supabase functions logs process-completed-challenges --follow
```

---

## 🎯 これで完了！

**✅ 毎日午前9時（JST）に自動実行**
**✅ 30日完了チャレンジの検出と返金処理**
**✅ エラーハンドリングと監視機能**

### ⏱️ 実際の所要時間: **約15分**

### 📋 次回以降のメンテナンス
- 週1回: ログ確認
- 月1回: 返金処理件数レビュー
- 四半期: エラー率とパフォーマンス分析

---

**🎉 自動返金システムが稼働開始しました！** 

お疲れ様でした！🚀 