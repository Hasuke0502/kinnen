-- 返金関連カラムをchallengesテーブルに追加
-- Edge Function エラー対応: 不足しているカラムを安全に追加

-- 1. refund_completed カラムの追加
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS refund_completed BOOLEAN DEFAULT false NOT NULL;

-- 2. refund_amount カラムの追加  
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;

-- 3. refund_completed_at カラムの追加
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS refund_completed_at TIMESTAMPTZ;

-- 4. stripe_refund_id カラムの追加
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- 確認メッセージ
DO $$ 
BEGIN 
    RAISE NOTICE '✅ 返金関連カラムの追加完了！';
    RAISE NOTICE '✅ challengesテーブルに以下のカラムを追加しました:';
    RAISE NOTICE '   - refund_completed: 返金完了フラグ';
    RAISE NOTICE '   - refund_amount: 返金額';
    RAISE NOTICE '   - refund_completed_at: 返金完了日時';
    RAISE NOTICE '   - stripe_refund_id: Stripe返金ID';
    RAISE NOTICE '🎉 これでEdge Functionが正常に動作します！';
END $$;
