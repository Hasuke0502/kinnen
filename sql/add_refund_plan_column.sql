-- user_profilesテーブルにrefund_planカラムを追加
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください

-- 1. refund_planカラムを追加
ALTER TABLE user_profiles 
ADD COLUMN refund_plan TEXT NOT NULL DEFAULT 'beginner' 
CHECK (refund_plan IN ('beginner', 'intermediate', 'advanced'));

-- 2. 既存のレコードに対してデフォルト値を設定（念のため）
UPDATE user_profiles 
SET refund_plan = 'beginner' 
WHERE refund_plan IS NULL;

-- 3. 変更を確認
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'refund_plan'; 