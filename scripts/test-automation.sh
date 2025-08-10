#!/bin/bash

# 禁煙30日チャレンジ 自動化テストスクリプト
# Edge Functionとcron jobの動作確認

set -e

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

# Supabaseプロジェクト情報を取得
get_project_info() {
    if [ -f ".supabase/config.toml" ]; then
        PROJECT_ID=$(grep 'project_id' .supabase/config.toml | cut -d'"' -f2)
        if [ -n "$PROJECT_ID" ]; then
            SUPABASE_URL="https://${PROJECT_ID}.supabase.co"
            log_info "プロジェクトURL: $SUPABASE_URL"
        else
            log_error "プロジェクトIDが見つかりません"
            exit 1
        fi
    else
        log_error "Supabaseプロジェクトとリンクされていません"
        exit 1
    fi
}

# サービスロールキーの入力
get_service_role_key() {
    echo ""
    log_info "サービスロールキーを入力してください:"
    log_warning "Supabase Dashboard > Settings > API で確認できます"
    read -s -p "Service Role Key: " SERVICE_ROLE_KEY
    echo ""
    
    if [ -z "$SERVICE_ROLE_KEY" ]; then
        log_error "サービスロールキーが入力されていません"
        exit 1
    fi
}

# Edge Functionのテスト
test_edge_function() {
    log_info "Edge Functionをテストしています..."
    
    RESPONSE=$(curl -s -w "\\n%{http_code}" -X POST \
        "${SUPABASE_URL}/functions/v1/process-completed-challenges" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    log_info "HTTP Status: $HTTP_CODE"
    log_info "Response: $BODY"
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "Edge Function テスト成功"
        
        # レスポンスを解析
        if echo "$BODY" | grep -q '"success":true'; then
            log_success "処理が正常に完了しました"
            
            # 処理結果の表示
            PROCESSED=$(echo "$BODY" | grep -o '"processed_count":[0-9]*' | cut -d':' -f2)
            REFUNDED=$(echo "$BODY" | grep -o '"refunded_count":[0-9]*' | cut -d':' -f2)
            ERRORS=$(echo "$BODY" | grep -o '"error_count":[0-9]*' | cut -d':' -f2)
            
            echo "📊 処理結果:"
            echo "  - 処理済みチャレンジ: ${PROCESSED:-0}"
            echo "  - 返金処理完了: ${REFUNDED:-0}"
            # 募金機能は廃止
            echo "  - エラー: ${ERRORS:-0}"
        else
            log_warning "処理でエラーが発生した可能性があります"
        fi
    else
        log_error "Edge Function テスト失敗"
        echo "詳細: $BODY"
        exit 1
    fi
}

# cron jobのテスト
test_cron_job() {
    log_info "cron jobの設定をテストしています..."
    
    # Supabase CLIを使用してSQL実行
    CRON_CHECK=$(supabase sql --query "SELECT COUNT(*) as job_count FROM cron.job WHERE jobname = 'process-completed-challenges';" 2>/dev/null || echo "ERROR")
    
    if [ "$CRON_CHECK" = "ERROR" ]; then
        log_warning "cron jobの確認でエラーが発生しました"
        log_info "Supabase Dashboard > Database > SQL Editor で以下を確認してください:"
        log_info "SELECT * FROM cron.job WHERE jobname = 'process-completed-challenges';"
    else
        log_success "cron job設定確認完了"
        echo "結果: $CRON_CHECK"
    fi
}

# データベース状態の確認
check_database_state() {
    log_info "データベース状態を確認しています..."
    
    # 完了対象チャレンジの確認
    EXPIRED_CHALLENGES=$(supabase sql --query "
        SELECT COUNT(*) as expired_count 
        FROM challenges 
        WHERE status = 'active' 
        AND end_date <= CURRENT_DATE;" 2>/dev/null || echo "ERROR")
    
    if [ "$EXPIRED_CHALLENGES" != "ERROR" ]; then
        echo "📅 期限切れチャレンジ: $EXPIRED_CHALLENGES"
    fi
    
    # 返金対象チャレンジの確認
    REFUND_TARGETS=$(supabase sql --query "
        SELECT COUNT(*) as refund_targets
        FROM challenges c
        JOIN user_profiles up ON c.user_id = up.user_id
        WHERE c.status = 'completed'
        AND up.payout_method = 'refund'
        AND c.refund_completed = false
        AND c.payment_completed = true;" 2>/dev/null || echo "ERROR")
    
    if [ "$REFUND_TARGETS" != "ERROR" ]; then
        echo "💰 返金対象チャレンジ: $REFUND_TARGETS"
    fi
}

# 次回実行スケジュールの表示
show_schedule_info() {
    log_info "次回自動実行スケジュール:"
    
    NEXT_RUN=$(supabase sql --query "
        SELECT 
            jobname,
            schedule,
            timezone,
            last_run,
            next_run
        FROM cron.job_next_runs 
        WHERE jobname = 'process-completed-challenges';" 2>/dev/null || echo "ERROR")
    
    if [ "$NEXT_RUN" != "ERROR" ]; then
        echo "$NEXT_RUN"
    else
        log_warning "スケジュール情報の取得に失敗しました"
        log_info "毎日 UTC 00:00 (JST 09:00) に実行予定です"
    fi
}

# メイン実行
main() {
    echo "=========================================="
    echo "🧪 禁煙30日チャレンジ 自動化テスト"
    echo "=========================================="
    
    get_project_info
    get_service_role_key
    
    echo ""
    test_edge_function
    
    echo ""
    test_cron_job
    
    echo ""
    check_database_state
    
    echo ""
    show_schedule_info
    
    echo ""
    log_success "自動化テストが完了しました！"
    
    echo ""
    log_info "定期的な監視のために以下を確認してください:"
    echo "  - Supabase Dashboard > Edge Functions > Logs"
    echo "  - cron job実行履歴: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;"
}

# スクリプト実行
main "$@" 