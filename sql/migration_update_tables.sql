-- 既存テーブルの更新マイグレーション
-- このSQLをSupabase SQL Editorで実行してください

-- 1. challengesテーブルに決済関連カラムを追加
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS payment_completed BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- 2. user_profilesテーブルの参加費制約を修正（0円参加を許可）
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_participation_fee_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_participation_fee_check 
CHECK (participation_fee >= 0);

-- 確認メッセージ
DO $$ 
BEGIN 
    RAISE NOTICE '✅ テーブル更新完了！';
    RAISE NOTICE '✅ challengesテーブルにpayment_completed, payment_completed_atカラムを追加しました';
    RAISE NOTICE '✅ user_profilesテーブルで0円参加を許可しました';
    RAISE NOTICE '🎉 これでStripe決済機能をテストできます！';
END $$; 