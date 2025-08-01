-- 禁煙チャレンジアプリ 初期スキーマ作成

-- ユーザープロファイルテーブル
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  smoking_frequency TEXT NOT NULL CHECK (smoking_frequency IN ('daily', 'weekly', 'monthly')),
  smoking_amount DECIMAL(3,1) NOT NULL CHECK (smoking_amount > 0),
  participation_fee INTEGER NOT NULL CHECK (participation_fee >= 0),
  payout_method TEXT NOT NULL DEFAULT 'refund' CHECK (payout_method IN ('refund')),
  record_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- チャレンジテーブル
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  total_success_days INTEGER DEFAULT 0 NOT NULL,
  total_failed_days INTEGER DEFAULT 0 NOT NULL,
  achievement_rate DECIMAL(5,2) DEFAULT 0 NOT NULL,

  payment_intent_id TEXT,
  payment_completed BOOLEAN DEFAULT false NOT NULL,
  payment_completed_at TIMESTAMPTZ,
  refund_completed BOOLEAN DEFAULT false NOT NULL,
  refund_amount INTEGER DEFAULT 0,
  refund_completed_at TIMESTAMPTZ,
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 毎日の記録テーブル
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  smoked BOOLEAN NOT NULL,
  countermeasure TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(challenge_id, record_date)
);



-- RLS (Row Level Security) の設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;


-- RLS ポリシーの設定
-- ユーザープロファイル：自分のデータのみアクセス可能
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- チャレンジ：自分のデータのみアクセス可能
CREATE POLICY "Users can view own challenges" ON challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON challenges FOR UPDATE USING (auth.uid() = user_id);

-- 毎日の記録：自分のデータのみアクセス可能
CREATE POLICY "Users can view own daily records" ON daily_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily records" ON daily_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily records" ON daily_records FOR UPDATE USING (auth.uid() = user_id);



-- 自動的なupdated_atの更新のためのトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガーの設定
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_records_updated_at BEFORE UPDATE ON daily_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




