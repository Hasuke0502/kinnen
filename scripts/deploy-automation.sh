#!/bin/bash

# 禁煙30日チャレンジ 自動化デプロイスクリプト
# Supabase Edge Functions による返金処理自動化

set -e

echo "🚀 禁煙30日チャレンジ 自動化デプロイを開始します..."

# 色付きログ関数
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# 前提条件チェック
check_prerequisites() {
    log_info "前提条件をチェックしています..."
    
    # Supabase CLIの確認
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLIがインストールされていません"
        log_info "インストール方法: npm install -g supabase"
        exit 1
    fi
    
    # プロジェクトリンクの確認
    if [ ! -f ".supabase/config.toml" ]; then
        log_error "Supabaseプロジェクトとリンクされていません"
        log_info "実行してください: supabase link --project-ref YOUR_PROJECT_ID"
        exit 1
    fi
    
    log_success "前提条件OK"
}

# データベースマイグレーション
run_migration() {
    log_info "データベースマイグレーションを実行しています..."
    
    if [ -f "sql/migration_refund_columns.sql" ]; then
        supabase sql --file sql/migration_refund_columns.sql
        log_success "マイグレーション完了"
    else
        log_warning "マイグレーションファイルが見つかりません: sql/migration_refund_columns.sql"
    fi
}

# Edge Functionデプロイ
deploy_edge_function() {
    log_info "Edge Functionをデプロイしています..."
    
    if [ -d "supabase/functions/process-completed-challenges" ]; then
        supabase functions deploy process-completed-challenges
        log_success "Edge Functionデプロイ完了"
    else
        log_error "Edge Functionディレクトリが見つかりません"
        exit 1
    fi
}

# 設定情報表示
show_next_steps() {
    log_info "次のステップを実行してください:"
    echo ""
    echo "1. 環境変数の設定"
    echo "   Supabase Dashboard > Edge Functions > process-completed-challenges > Settings"
    echo "   以下の変数を設定してください:"
    echo "   - SUPABASE_URL: $(supabase status | grep API | awk '{print $3}' || echo 'https://your-project.supabase.co')"
    echo "   - SUPABASE_SERVICE_ROLE_KEY: [Supabase Dashboard > Settings > API で確認]"
    echo "   - STRIPE_SECRET_KEY: [Stripe Dashboard > Developers > API keys で確認]"
    echo ""
    echo "2. cron jobの設定"
    echo "   Supabase Dashboard > Database > SQL Editor で以下を実行:"
    echo "   - sql/create_cron_job.sql の内容をコピー&ペースト"
    echo "   - YOUR_PROJECT と YOUR_SERVICE_ROLE_KEY を実際の値に置き換え"
    echo ""
    echo "3. テスト実行"
    echo "   curl -X POST https://your-project.supabase.co/functions/v1/process-completed-challenges \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -H \"Authorization: Bearer YOUR_SERVICE_ROLE_KEY\""
    echo ""
    echo "詳細な手順: SUPABASE_AUTOMATION_SETUP.md を参照してください"
}

# メイン実行
main() {
    echo "=================================="
    echo "🎯 禁煙30日チャレンジ 自動化デプロイ"
    echo "=================================="
    
    check_prerequisites
    run_migration
    deploy_edge_function
    
    log_success "デプロイが完了しました！"
    show_next_steps
}

# スクリプト実行
main "$@" 