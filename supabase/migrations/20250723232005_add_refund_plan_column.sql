-- user_profilesテーブルにrefund_planカラムを追加
ALTER TABLE user_profiles 
ADD COLUMN refund_plan TEXT NOT NULL DEFAULT 'beginner' 
CHECK (refund_plan IN ('beginner', 'intermediate', 'advanced'));

-- 既存のレコードに対してデフォルト値を設定
UPDATE user_profiles 
SET refund_plan = 'beginner' 
WHERE refund_plan IS NULL; 