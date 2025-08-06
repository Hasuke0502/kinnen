# 返金処理テスト手順書

## 🎯 概要

禁煙30日チャレンジアプリの返金処理機能をテストするための手順書です。

## 📋 実装された返金機能

### ✅ 実装済み機能
1. **Stripe返金API** - `/api/refund`
2. **チャレンジ完了判定** - `/api/complete-challenge`
3. **返金額計算ロジック** - 要件定義書通りの計算式
4. **データベース拡張** - 返金関連カラムの追加
5. **UI表示** - チャレンジ完了時の返金状況表示
6. **テスト用API** - 開発環境での動作確認用

### 📊 返金計算ロジック
```
返金額 = 参加費 × (記録成功日数 ÷ 30日)
```

## 🛠️ セットアップ

### 1. データベースマイグレーション

Supabase SQL Editorで以下のファイルを実行：

```sql
-- sql/migration_refund_columns.sql
-- challengesテーブルに返金関連カラムを追加
```

### 2. 環境変数の確認

`.env.local`で以下が設定されていることを確認：

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 テスト手順

### 段階1: 基本セットアップ

1. **ユーザー登録・ログイン**
   ```
   アカウントを作成してログイン
   ```

2. **オンボーディング**
   ```
   - 喫煙状況: 1日1箱など
   - 参加費: 10,000円
   - 返金方法: 「返金を受け取る」を選択
   ```

3. **決済完了**
   ```
   テスト用カード番号: 4242 4242 4242 4242
   有効期限: 12/34
   CVC: 123
   ```

### 段階2: 記録作成

4. **複数日の記録**
   ```
   - 20日分の記録を作成（記録成功日数: 20日）
   - /record ページで記録を追加
   - 禁煙・喫煙どちらでも記録すれば成功日数としてカウント
   ```

### 段階3: チャレンジ完了テスト

5. **チャレンジ強制完了（テスト用）**
   ```bash
   curl -X POST http://localhost:3000/api/test-complete-challenge \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-auth-token=YOUR_SESSION_TOKEN"
   ```

6. **ダッシュボード確認**
   ```
   - チャレンジ完了の緑色表示が出現
   - 「完全勝利！マネーモンスターを倒しました！」メッセージ
   - 最終結果の表示：記録成功日数、達成率、返金額
   ```

### 段階4: 返金処理テスト

7. **返金シミュレーション（テスト用）**
   ```bash
   curl -X POST http://localhost:3000/api/test-refund \
     -H "Content-Type: application/json" \
     -H "Cookie: sb-auth-token=YOUR_SESSION_TOKEN"
   ```

8. **返金完了状態の確認**
   ```
   - ダッシュボードに「返金完了済み」バッジが表示
   - 期待される返金額: 10,000円 × (20日 ÷ 30日) = 6,667円
   ```

## 🔍 期待される結果

### 返金額計算例

| 参加費 | 記録成功日数 | 計算式 | 返金額 |
|--------|-------------|--------|--------|
| 10,000円 | 30日 | 10,000 × 1.0 | 10,000円 |
| 10,000円 | 20日 | 10,000 × 0.67 | 6,667円 |
| 10,000円 | 15日 | 10,000 × 0.5 | 5,000円 |
| 500円 | 30日 | 500 × 1.0 | 500円 |

### UI表示の確認ポイント

1. **進行中の場合**
   - 「返金予定額」の表示
   - 「今日の記録をつけましょう」ボタン

2. **完了時の場合**
   - 緑色のグラデーション背景
   - 🎉 アイコンと勝利メッセージ
   - 最終結果の統計表示
   - 返金ステータスバッジ

## 🚨 実際の本番環境での注意事項

### 本番環境で使用する場合

1. **テスト用APIの無効化**
   ```
   - /api/test-complete-challenge
   - /api/test-refund
   これらは本番環境では動作しません（NODE_ENV=productionで無効）
   ```

2. **実際のStripe処理**
   ```
   - 本番環境では実際のStripe返金APIが呼び出されます
   - 必ずテスト環境で十分に検証してから本番適用してください
   ```

3. **自動化の実装**
   ```
   - 現在は手動でAPIを呼び出すテスト手順です
   - 本番では cron job や Supabase Functions で自動化が必要
   ```

## 📞 トラブルシューティング

### よくある問題

1. **「No active challenge found」エラー**
   ```
   解決: オンボーディングから有効なチャレンジを作成
   ```

2. **「Unauthorized」エラー**
   ```
   解決: ログイン状態を確認、認証トークンの有効性をチェック
   ```

3. **返金額が0円**
   ```
   確認: 記録成功日数があるか
   ```

4. **Stripe返金エラー**
   ```
   確認: STRIPE_SECRET_KEYが正しく設定されているか
   確認: payment_intent_idが存在するか
   ```

## 🔗 関連ファイル

- `/app/api/refund/route.ts` - 返金処理API
- `/app/api/complete-challenge/route.ts` - チャレンジ完了API
- `/app/api/test-complete-challenge/route.ts` - テスト用完了API
- `/app/api/test-refund/route.ts` - テスト用返金API
- `/app/dashboard/page.tsx` - チャレンジ完了UI
- `/lib/stripe.ts` - Stripe返金関数
- `/sql/migration_refund_columns.sql` - DB マイグレーション 