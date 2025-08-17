import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinnen.vercel.app'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description: '禁煙30日チャレンジの特定商取引法に基づく表記です。',
  openGraph: {
    type: 'article',
    url: `${siteUrl}/legal/commercial-transactions`,
    title: '特定商取引法に基づく表記',
    description: 'サービスの提供条件や返金・支払方法などの情報を掲載しています。',
    images: [
      { url: '/og?title=%E7%89%B9%E5%AE%9A%E5%95%86%E5%8F%96%E5%BC%95%E6%B3%95', width: 1200, height: 630, alt: '特商法ページ OGP' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '特定商取引法に基づく表記',
    description: 'サービスの提供条件や返金・支払方法などの情報を掲載しています。',
    images: ['/og?title=%E7%89%B9%E5%AE%9A%E5%95%86%E5%8F%96%E5%BC%95%E6%B3%95'],
  },
};

export default function CommercialTransactionsPage() {
  const lastUpdatedDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">特定商取引法に基づく表記</h1>

        <div className="space-y-4 text-gray-700">
          <p className="text-sm text-gray-500 text-right">最終更新日：{lastUpdatedDate}</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. 販売事業者</h2>
            <p className="pl-4">大久保葉介（個人）</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. 運営統括責任者</h2>
            <p className="pl-4">大久保葉介</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. 所在地</h2>
            <p className="pl-4">※請求があったら遅滞なく開示します</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. 連絡先</h2>
            <ul className="list-disc list-inside pl-4">
              <li>メールアドレス：yabaichemistryteacher@gmail.com</li>
              <li>電話番号：※請求があったら遅滞なく開示します</li>
              <li>営業時間：平日10:00〜18:00（土日祝日・年末年始を除く）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">5. 販売価格</h2>
            <p className="pl-4">オンボーディング時に表示される参加費に準じます※表示価格は全て税込みです</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">6. 商品代金以外の必要料金</h2>
            <ul className="list-disc list-inside pl-4">
              <li>決済手数料：無料</li>
              <li>返金手数料：無料</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">7. 支払方法</h2>
            <p className="pl-4">クレジットカード決済（Stripe）対応カード：Visa, Mastercard, American Express, JCB</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">8. 支払時期</h2>
            <p className="pl-4">クレジットカード決済の場合、オンボーディング時の参加費設定時に即時決済されます</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">9. 商品の引渡時期</h2>
            <p className="pl-4">参加費決済完了後、即時に禁煙チャレンジ機能の利用を開始いただけます。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">10. 返品・キャンセルについて</h2>
            <ul className="list-disc list-inside pl-4">
              <li>**お客様都合による返金の場合**：
                <ul className="list-circle list-inside pl-4">
                  <li>チャレンジの途中放棄は可能ですが、参加費の返金はありません。</li>
                  <li>チャレンジ完了後（30日経過後、または30日分の記録が全て埋まった時点）の返金については、記録成功日数に応じて返金計算式に基づき算定された金額が返金されます。</li>
                </ul>
              </li>
              <li>**サービスに不具合があった場合**：当社の責任において速やかに不具合を修正、もしくは全額返金いたします。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">11. 特記事項</h2>
            <ul className="list-disc list-inside pl-4">
              <li>本サービスはデジタルコンテンツ（禁煙チャレンジ機能の提供）です。</li>
              <li>サービスの性質上、提供開始後の参加費の途中返金は承っておりません。</li>
              <li>チャレンジ完了後の返金は、記録成功日数に基づく計算式に則って行われます。</li>
              <li>詳細はオンボーディング画面およびアプリ内の説明をご確認ください。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
} 