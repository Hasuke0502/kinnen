export function getJSTDate(): string {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
  const jstTime = new Date(now.getTime() + jstOffset);
  return jstTime.toISOString().split('T')[0];
}

export function getJSTTime(): Date {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
  return new Date(now.getTime() + jstOffset);
} 