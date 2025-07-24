-- Supabase Edge Functions用のcron job設定
-- pg_cron拡張機能を使用してEdge Functionを定期実行

-- pg_cron拡張機能を有効化（ダッシュボードから実行が推奨）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 毎日午前9時（JST）に実行（UTC午前0時）
-- Edge Functionを呼び出すジョブを設定
SELECT cron.schedule(
  'process-completed-challenges',
  '0 0 * * *', -- 毎日UTC午前0時（JST午前9時）
  $$ 
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/process-completed-challenges',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer your_service_role_key'
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- ジョブの確認
SELECT * FROM cron.job WHERE jobname = 'process-completed-challenges';

-- ジョブの実行履歴を確認
SELECT * FROM cron.job_run_details WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'process-completed-challenges'
) ORDER BY start_time DESC LIMIT 10;

-- 注意: 上記のURLとAuthorizationトークンは実際の値に置き換えてください
-- - your-project.supabase.co を実際のSupabaseプロジェクトURLに変更
-- - your_service_role_key を実際のサービスロールキーに変更 