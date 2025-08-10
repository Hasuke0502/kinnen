export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">禁煙30日チャレンジ</h3>
            <p className="text-sm">マネーモンスターと戦い、30日間で禁煙を成功させよう！</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">サービス</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/auth/login" className="hover:text-white">ログイン / 新規登録</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/legal/commercial-transactions" className="hover:text-white">
                  特定商取引法に基づく表記
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} 禁煙30日チャレンジ</p>
        </div>
      </div>
    </footer>
  )
}


