// 日本時間での日付を取得する関数
export function getJSTDate(): string {
  const now = new Date();
  // 日本時間（UTC+9）に変換
  const jstOffset = 9 * 60 * 60 * 1000 // 9時間をミリ秒に変換
  const jstTime = new Date(now.getTime() + jstOffset);
  return jstTime.toISOString().split('T')[0];
} 